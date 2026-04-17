import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { cancelInvoiceSchema, createManualInvoiceSchema, generatePeriodicInvoicesSchema } from "./invoice.schemas.js";
import { createManualInvoice, generatePeriodicInvoices } from "./invoice.service.js";

export const invoiceRouter = Router();

function getInvoiceScope(req: Express.Request) {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return {};
  }

  return {
    subscription: {
      customer: {
        activatedFromProspect: {
          createdByUserId: currentUser.id,
        },
      },
    },
  };
}

invoiceRouter.use(authenticate);

invoiceRouter.get("/", authorize("invoices.list"), async (req, res, next) => {
  try {
    const scope = getInvoiceScope(req);
    const invoices = await db.invoice.findMany({
      where: scope ?? undefined,
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNo: true,
        periodStart: true,
        periodEnd: true,
        issueDate: true,
        dueDate: true,
        totalAmount: true,
        status: true,
        isProrated: true,
        subscription: {
          select: {
            subscriptionNo: true,
            customer: {
              select: {
                id: true,
                customerCode: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return sendOk(res, invoices, "invoices loaded");
  } catch (error) {
    return next(error);
  }
});

invoiceRouter.post("/manual", authorize("invoices.create_manual"), async (req, res, next) => {
  try {
    const parsed = createManualInvoiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid manual invoice payload", parsed.error.flatten());
    }

    try {
      const result = await createManualInvoice(parsed.data);

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "invoices",
        action: "create_manual",
        entityType: "invoice",
        entityId: result.invoice.id,
        newValues: result.invoice,
      });

      return sendOk(res, result, "manual invoice created");
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

invoiceRouter.post("/generate-periodic", authorize("invoices.generate_periodic"), async (req, res, next) => {
  try {
    const parsed = generatePeriodicInvoicesSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid periodic invoice payload", parsed.error.flatten());
    }

    const result = await generatePeriodicInvoices(parsed.data);

    for (const item of result.created) {
      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "invoices",
        action: "generate_periodic",
        entityType: "invoice",
        entityId: item.id,
        newValues: item,
      });
    }

    return sendOk(res, result, "periodic invoices generated");
  } catch (error) {
    if (error instanceof Error) {
      return sendError(res, 400, error.message);
    }

    return next(error);
  }
});

invoiceRouter.get("/:id", authorize("invoices.read"), async (req, res, next) => {
  try {
    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getInvoiceScope(req);
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(scope ?? {}),
      },
      include: {
        invoiceItems: true,
        payments: {
          select: {
            id: true,
            paymentNo: true,
            paymentDate: true,
            amount: true,
            status: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNo: true,
            customer: {
              select: {
                id: true,
                customerCode: true,
                fullName: true,
                phone: true,
              },
            },
            servicePlan: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return sendError(res, 404, "Invoice not found");
    }

    return sendOk(res, invoice, "invoice loaded");
  } catch (error) {
    return next(error);
  }
});

invoiceRouter.post("/:id/cancel", authorize("invoices.cancel"), async (req, res, next) => {
  try {
    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = cancelInvoiceSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return sendError(res, 400, "Invalid invoice cancel payload", parsed.error.flatten());
    }

    const existingInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: {
            status: "confirmed",
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingInvoice) {
      return sendError(res, 404, "Invoice not found");
    }

    if (existingInvoice.status === "paid") {
      return sendError(res, 400, "Paid invoice cannot be cancelled");
    }

    if (existingInvoice.payments.length > 0) {
      return sendError(res, 400, "Invoice with confirmed payment cannot be cancelled");
    }

    const invoice = await db.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "cancelled",
          notes: parsed.data.reason
            ? `${existingInvoice.notes ? `${existingInvoice.notes}\n\n` : ""}Cancelled: ${parsed.data.reason}`
            : existingInvoice.notes,
        },
      });

      await tx.notificationLog.updateMany({
        where: {
          invoiceId,
          status: "pending",
        },
        data: {
          status: "cancelled",
          errorMessage: parsed.data.reason ?? "Invoice cancelled",
        },
      });

      return updated;
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "invoices",
      action: "cancel",
      entityType: "invoice",
      entityId: invoice.id,
      oldValues: existingInvoice,
      newValues: invoice,
    });

    return sendOk(res, invoice, "invoice cancelled");
  } catch (error) {
    return next(error);
  }
});
