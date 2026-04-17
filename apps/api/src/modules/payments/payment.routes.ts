import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createPaymentSchema, rejectPaymentSchema, verifyPaymentSchema } from "./payment.schemas.js";
import { createPayment, rejectPayment, verifyPaymentAndApplyEffects } from "./payment.service.js";

export const paymentRouter = Router();

function getPaymentScope(req: Express.Request) {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return {};
  }

  return {
    collectedByUserId: currentUser.id,
  };
}

paymentRouter.use(authenticate);

paymentRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid payment payload", parsed.error.flatten());
    }

    const requiredPermission =
      parsed.data.sourceType === "field_collection"
        ? "payments.create_field_collection"
        : "payments.create_transfer";

    if (!req.currentUser?.permissions.includes(requiredPermission)) {
      return sendError(res, 403, "Forbidden", {
        missingPermissions: [requiredPermission],
      });
    }

    if (parsed.data.sourceType === "field_collection" && req.currentUser.role.code === "customer") {
      return sendError(res, 403, "Forbidden");
    }

    if (req.currentUser.role.code === "teknisi") {
      const allowedTarget = await db.customer.findFirst({
        where: {
          deletedAt: null,
          ...(parsed.data.customerId ? { id: parsed.data.customerId } : {}),
          ...(parsed.data.subscriptionId
            ? {
                subscriptions: {
                  some: {
                    id: parsed.data.subscriptionId,
                  },
                },
              }
            : {}),
          ...(parsed.data.invoiceId
            ? {
                subscriptions: {
                  some: {
                    invoices: {
                      some: {
                        id: parsed.data.invoiceId,
                      },
                    },
                  },
                },
              }
            : {}),
          activatedFromProspect: {
            createdByUserId: req.currentUser.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (
        parsed.data.customerId ||
        parsed.data.subscriptionId ||
        parsed.data.invoiceId
      ) {
        if (!allowedTarget) {
          return sendError(res, 403, "Forbidden");
        }
      } else {
        const hasAnyScopedCustomer = await db.customer.findFirst({
          where: {
            activatedFromProspect: {
              createdByUserId: req.currentUser.id,
            },
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!hasAnyScopedCustomer) {
          return sendError(res, 403, "Forbidden");
        }
      }
    }

    try {
      const result = await createPayment({
        ...parsed.data,
        createdByUserId: req.currentUser.id,
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "payments",
        action: "create",
        entityType: "payment",
        entityId: result.payment.id,
        newValues: result.payment,
      });

      return sendCreated(res, result, "payment created");
    } catch (error) {
      if (error instanceof Error) {
        return sendError(res, 400, error.message);
      }

      throw error;
    }
  } catch (error) {
    return next(error);
  }
});

paymentRouter.get("/", authorize("payments.list"), async (req, res, next) => {
  try {
    const scope = getPaymentScope(req);
    const payments = await db.payment.findMany({
      where: scope ?? undefined,
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paymentNo: true,
        paymentDate: true,
        amount: true,
        status: true,
        method: true,
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
          },
        },
      },
    });

    return sendOk(res, payments, "payments loaded");
  } catch (error) {
    return next(error);
  }
});

paymentRouter.get("/:id", authorize("payments.read"), async (req, res, next) => {
  try {
    const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getPaymentScope(req);
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        ...(scope ?? {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            status: true,
            dueDate: true,
            subscriptionId: true,
          },
        },
      },
    });

    if (!payment) {
      return sendError(res, 404, "Payment not found");
    }

    return sendOk(res, payment, "payment loaded");
  } catch (error) {
    return next(error);
  }
});

paymentRouter.post("/:id/verify", authorize("payments.verify"), async (req, res, next) => {
  try {
    const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid payment verification payload", parsed.error.flatten());
    }

    try {
      const result = await verifyPaymentAndApplyEffects({
        paymentId,
        confirmedByUserId: req.currentUser!.id,
        notes: parsed.data.notes,
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "payments",
        action: "verify",
        entityType: "payment",
        entityId: result.payment.id,
        oldValues: result.paymentBefore,
        newValues: result.payment,
      });

      if (result.invoiceFullyPaid) {
        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "invoices",
          action: "mark_paid",
          entityType: "invoice",
          entityId: result.invoice.id,
          oldValues: {
            id: result.paymentBefore.invoice.id,
            status: result.paymentBefore.invoice.status,
          },
          newValues: {
            id: result.invoice.id,
            status: result.invoice.status,
          },
        });
      }

      if (result.renewal) {
        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "renewals",
          action: "confirm_from_payment",
          entityType: "subscription_renewal",
          entityId: result.renewal.id,
          oldValues: {
            id: result.renewal.id,
            status: "pending_payment",
          },
          newValues: result.renewal,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "subscriptions",
          action: "extend_from_renewal_payment",
          entityType: "subscription",
          entityId: result.subscription.id,
          oldValues: {
            id: result.subscription.id,
            currentPeriodEnd: result.renewal.oldPeriodEnd,
          },
          newValues: {
            id: result.subscription.id,
            currentPeriodEnd: result.subscription.currentPeriodEnd,
          },
        });
      }

      if (result.cashTransaction) {
        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "cash_transactions",
          action: "create_from_payment_confirmation",
          entityType: "cash_transaction",
          entityId: result.cashTransaction.id,
          newValues: result.cashTransaction,
        });
      }

      return sendOk(res, result, "payment verified");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Payment not found") {
          return sendError(res, 404, error.message);
        }

        return sendError(res, 400, error.message);
      }

      throw error;
    }
  } catch (error) {
    return next(error);
  }
});

paymentRouter.post("/:id/reject", authorize("payments.reject"), async (req, res, next) => {
  try {
    const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = rejectPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid payment reject payload", parsed.error.flatten());
    }

    try {
      const result = await rejectPayment({
        paymentId,
        rejectedByUserId: req.currentUser!.id,
        notes: parsed.data.notes,
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "payments",
        action: "reject",
        entityType: "payment",
        entityId: result.payment.id,
        oldValues: result.paymentBefore,
        newValues: result.payment,
      });

      return sendOk(res, result, "payment rejected");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Payment not found") {
          return sendError(res, 404, error.message);
        }

        return sendError(res, 400, error.message);
      }

      throw error;
    }
  } catch (error) {
    return next(error);
  }
});
