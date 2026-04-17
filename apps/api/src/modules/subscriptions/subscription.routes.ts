import { Router } from "express";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { listSubscriptionsQuerySchema } from "./subscription.schemas.js";

export const subscriptionRouter = Router();

function getSubscriptionScope(req: Express.Request) {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return {};
  }

  return {
    customer: {
      activatedFromProspect: {
        createdByUserId: currentUser.id,
      },
    },
  };
}

subscriptionRouter.use(authenticate);

subscriptionRouter.get("/", authorize("subscriptions.list"), async (req, res, next) => {
  try {
    const parsedQuery = listSubscriptionsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return sendError(res, 400, "Invalid subscription query", parsedQuery.error.flatten());
    }

    const { q, pageSize } = parsedQuery.data;
    const subscriptions = await db.subscription.findMany({
      where: {
        ...(getSubscriptionScope(req) ?? {}),
        ...(q
          ? {
              OR: [
                { subscriptionNo: { contains: q, mode: "insensitive" } },
                { customer: { customerCode: { contains: q, mode: "insensitive" } } },
                { customer: { fullName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subscriptionNo: true,
        status: true,
        activationDate: true,
        billingAnchorDay: true,
        customer: {
          select: {
            customerCode: true,
            fullName: true,
          },
        },
      },
    });

    return sendOk(res, subscriptions, "subscriptions loaded");
  } catch (error) {
    return next(error);
  }
});

subscriptionRouter.get("/:id", authorize("subscriptions.read"), async (req, res, next) => {
  try {
    const subscriptionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getSubscriptionScope(req);
    const subscription = await db.subscription.findFirst({
      where: {
        id: subscriptionId,
        ...(scope ?? {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
        servicePlan: {
          select: {
            id: true,
            code: true,
            name: true,
            priceMonthly: true,
            downloadMbps: true,
            uploadMbps: true,
          },
        },
        installationAddress: true,
        invoices: {
          orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
          take: 12,
          select: {
            id: true,
            invoiceNo: true,
            issueDate: true,
            dueDate: true,
            totalAmount: true,
            status: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        renewals: {
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            renewalNo: true,
            oldPeriodEnd: true,
            newPeriodEnd: true,
            durationMonth: true,
            amount: true,
            status: true,
            confirmedAt: true,
          },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            ticketNo: true,
            subject: true,
            status: true,
            priority: true,
            category: true,
            openedAt: true,
          },
        },
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            workOrderNo: true,
            sourceType: true,
            status: true,
            scheduledDate: true,
            completedAt: true,
          },
        },
      },
    });

    if (!subscription) {
      return sendError(res, 404, "Subscription not found");
    }

    const paymentSummary = await db.payment.aggregate({
      where: {
        invoice: {
          subscriptionId: subscription.id,
        },
        status: "confirmed",
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return sendOk(
      res,
      {
        ...subscription,
        paymentSummary: {
          confirmedCount: paymentSummary._count.id,
          confirmedAmount: paymentSummary._sum.amount ?? 0,
        },
      },
      "subscription loaded",
    );
  } catch (error) {
    return next(error);
  }
});
