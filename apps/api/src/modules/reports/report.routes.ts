import { Router } from "express";
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
      db.prospect.count(),
      db.customer.count(),
      db.subscription.count(),
      db.invoice.count({ where: { status: "overdue" } }),
      db.cashTransaction.aggregate({
        where: {
          type: "cash_in",
          status: "confirmed",
          transactionDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
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
