import { Router, Express } from "express";
import { Prisma } from "@ispmanager/db";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { z } from "zod";

const summaryQuerySchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});

export const reportRouter = Router();

// Helper function untuk build scope based on user role
function getProspectReportScope(req: Express.Request): Prisma.ProspectWhereInput {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return {};
  }

  // Tech/Sales: hanya prospect yang mereka create
  return {
    createdByUserId: currentUser.id,
  };
}

function getCustomerReportScope(req: Express.Request): Prisma.CustomerWhereInput {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return {};
  }

  // Tech/Sales: hanya customer dari prospect yang mereka create
  return {
    activatedFromProspect: {
      createdByUserId: currentUser.id,
    },
  };
}

function getSubscriptionReportScope(req: Express.Request): Prisma.SubscriptionWhereInput {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return {};
  }

  // Tech/Sales: hanya subscription dari customer mereka
  return {
    customer: {
      activatedFromProspect: {
        createdByUserId: currentUser.id,
      },
    },
  };
}

function getInvoiceReportScope(req: Express.Request): Prisma.InvoiceWhereInput {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return {};
  }

  // Tech/Sales: hanya invoice dari customer mereka
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

function getCashTransactionReportScope(req: Express.Request): Prisma.CashTransactionWhereInput {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return {};
  }

  // Tech/Sales: hanya cash transaction dari customer mereka atau yang mereka create
  return {
    OR: [
      // Cash transactions from their created customers
      {
        subscription: {
          customer: {
            activatedFromProspect: {
              createdByUserId: currentUser.id,
            },
          },
        },
      },
      // Cash transactions they created directly
      {
        createdByUserId: currentUser.id,
      },
    ],
  };
}

reportRouter.use(authenticate);

reportRouter.get("/summary", authorize("reports.revenue.read"), async (req, res, next) => {
  try {
    const parsedQuery = summaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return sendError(res, 400, "Invalid report summary query", parsedQuery.error.flatten());
    }

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const financeDateFrom = parsedQuery.data.dateFrom ? new Date(parsedQuery.data.dateFrom) : monthStart;
    const financeDateToExclusive = parsedQuery.data.dateTo
      ? new Date(Date.UTC(
          new Date(parsedQuery.data.dateTo).getUTCFullYear(),
          new Date(parsedQuery.data.dateTo).getUTCMonth(),
          new Date(parsedQuery.data.dateTo).getUTCDate() + 1,
        ))
      : nextMonthStart;

    const [
      prospects,
      customers,
      subscriptions,
      invoicesOverdue,
      cashInTodayAggregate,
      cashOutTodayAggregate,
      cashInMonthAggregate,
      cashOutMonthAggregate,
      subscriptionIncomeMonthAggregate,
      installationIncomeMonthAggregate,
    ] = await Promise.all([
      db.prospect.count({ where: getProspectReportScope(req) }),
      db.customer.count({ where: getCustomerReportScope(req) }),
      db.subscription.count({ where: getSubscriptionReportScope(req) }),
      db.invoice.count({ 
        where: { 
          status: "overdue",
          ...getInvoiceReportScope(req),
        } 
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_in",
          status: "confirmed",
          transactionDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_out",
          status: "confirmed",
          transactionDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_in",
          status: "confirmed",
          transactionDate: {
            gte: financeDateFrom,
            lt: financeDateToExclusive,
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_out",
          status: "confirmed",
          transactionDate: {
            gte: financeDateFrom,
            lt: financeDateToExclusive,
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_in",
          status: "confirmed",
          transactionDate: {
            gte: financeDateFrom,
            lt: financeDateToExclusive,
          },
          cashCategory: {
            code: "subscription_income",
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_in",
          status: "confirmed",
          transactionDate: {
            gte: financeDateFrom,
            lt: financeDateToExclusive,
          },
          cashCategory: {
            code: "installation_fee",
          },
          ...getCashTransactionReportScope(req),
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const cashInToday = cashInTodayAggregate._sum.amount ?? new Prisma.Decimal(0);
    const cashOutToday = cashOutTodayAggregate._sum.amount ?? new Prisma.Decimal(0);
    const cashInMonth = cashInMonthAggregate._sum.amount ?? new Prisma.Decimal(0);
    const cashOutMonth = cashOutMonthAggregate._sum.amount ?? new Prisma.Decimal(0);
    const subscriptionIncomeMonth = subscriptionIncomeMonthAggregate._sum.amount ?? new Prisma.Decimal(0);
    const installationIncomeMonth = installationIncomeMonthAggregate._sum.amount ?? new Prisma.Decimal(0);

    return sendOk(
      res,
      {
        prospects,
        customers,
        subscriptions,
        invoicesOverdue,
        finance: {
          dateFrom: financeDateFrom,
          dateToExclusive: financeDateToExclusive,
          cashInToday,
          cashOutToday,
          netCashToday: cashInToday.minus(cashOutToday),
          cashInMonth,
          cashOutMonth,
          netCashMonth: cashInMonth.minus(cashOutMonth),
          subscriptionIncomeMonth,
          installationIncomeMonth,
        },
      },
      "report summary loaded",
    );
  } catch (error) {
    return next(error);
  }
});
