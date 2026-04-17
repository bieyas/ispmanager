import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createRenewalSchema } from "./renewal.schemas.js";
import { createRenewalWithInvoice } from "./renewal.service.js";

export const renewalRouter = Router();

function getRenewalScope(req: Express.Request) {
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

renewalRouter.use(authenticate);

renewalRouter.get("/", authorize("renewals.list"), async (req, res, next) => {
  try {
    const scope = getRenewalScope(req);
    const renewals = await db.subscriptionRenewal.findMany({
      where: scope ?? undefined,
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        renewalNo: true,
        oldPeriodEnd: true,
        newPeriodEnd: true,
        durationMonth: true,
        amount: true,
        status: true,
        subscription: {
          select: {
            subscriptionNo: true,
            customer: {
              select: {
                customerCode: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return sendOk(res, renewals, "renewals loaded");
  } catch (error) {
    return next(error);
  }
});

renewalRouter.get("/:id", authorize("renewals.read"), async (req, res, next) => {
  try {
    const renewalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getRenewalScope(req);
    const renewal = await db.subscriptionRenewal.findFirst({
      where: {
        id: renewalId,
        ...(scope ?? {}),
      },
      include: {
        invoice: {
          include: {
            invoiceItems: true,
          },
        },
        payment: true,
        subscription: {
          select: {
            id: true,
            subscriptionNo: true,
            customer: {
              select: {
                customerCode: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!renewal) {
      return sendError(res, 404, "Renewal not found");
    }

    return sendOk(res, renewal, "renewal loaded");
  } catch (error) {
    return next(error);
  }
});

renewalRouter.post("/", authorize("renewals.create"), async (req, res, next) => {
  try {
    const parsed = createRenewalSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid renewal payload", parsed.error.flatten());
    }

    const subscription = await db.subscription.findUnique({
      where: { id: parsed.data.subscriptionId },
      include: {
        customer: {
          include: {
            activatedFromProspect: {
              select: {
                createdByUserId: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return sendError(res, 404, "Subscription not found");
    }

    if (
      req.currentUser?.role.code === "teknisi" &&
      subscription.customer.activatedFromProspect.createdByUserId !== req.currentUser.id
    ) {
      return sendError(res, 403, "Forbidden");
    }

    try {
      const result = await createRenewalWithInvoice({
        subscriptionId: parsed.data.subscriptionId,
        processedByUserId: req.currentUser!.id,
        durationMonth: parsed.data.durationMonth,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        notes: parsed.data.notes,
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "renewals",
        action: "create",
        entityType: "subscription_renewal",
        entityId: result.renewal.id,
        newValues: result.renewal,
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "invoices",
        action: "create_for_renewal",
        entityType: "invoice",
        entityId: result.invoice.id,
        newValues: result.invoice,
      });

      return sendCreated(res, result, "renewal created");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Subscription not found") {
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
