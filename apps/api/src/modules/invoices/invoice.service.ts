import { Prisma } from "@ispmanager/db";
import { addMonths, endOfPreviousDay, parseDateInput, resolveAnchorDate } from "../../lib/date.js";
import { createInvoiceWithSingleItem } from "../../lib/billing.js";
import { db } from "../../lib/db.js";

function addDays(date: Date, days: number) {
  const next = parseDateInput(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getNextPeriodRange(subscription: {
  currentPeriodEnd: Date;
  billingAnchorDay: number;
}) {
  const periodStart = addDays(subscription.currentPeriodEnd, 1);
  const periodEnd = endOfPreviousDay(addMonths(periodStart, 1));
  const billingAnchorDate = resolveAnchorDate(periodStart, subscription.billingAnchorDay);

  return {
    periodStart,
    periodEnd,
    billingAnchorDate,
  };
}

async function ensureNoDuplicateInvoice(
  tx: Prisma.TransactionClient,
  input: {
    subscriptionId: string;
    periodStart: Date;
    periodEnd: Date;
  },
) {
  const existing = await tx.invoice.findFirst({
    where: {
      subscriptionId: input.subscriptionId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: {
        not: "cancelled",
      },
    },
    select: {
      id: true,
      invoiceNo: true,
      status: true,
    },
  });

  if (existing) {
    throw new Error(`Invoice already exists for this period: ${existing.invoiceNo}`);
  }
}

export async function createManualInvoice(input: {
  subscriptionId: string;
  issueDate?: string;
  dueDate?: string;
  billingAnchorDate?: string;
  periodStart?: string;
  periodEnd?: string;
  amount?: number;
  notes?: string | null;
}) {
  const issueDate = parseDateInput(input.issueDate ?? new Date());

  return db.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { id: input.subscriptionId },
      include: {
        customer: true,
        servicePlan: true,
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.status !== "active") {
      throw new Error("Only active subscriptions can be invoiced");
    }

    const defaultPeriod = getNextPeriodRange(subscription);
    const periodStart = parseDateInput(input.periodStart ?? defaultPeriod.periodStart);
    const periodEnd = parseDateInput(input.periodEnd ?? defaultPeriod.periodEnd);
    const dueDate = parseDateInput(input.dueDate ?? periodEnd);
    const billingAnchorDate = parseDateInput(input.billingAnchorDate ?? defaultPeriod.billingAnchorDate);
    const amount = new Prisma.Decimal(input.amount ?? subscription.servicePlan.priceMonthly).toDecimalPlaces(2);

    await ensureNoDuplicateInvoice(tx, {
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
    });

    const invoice = await createInvoiceWithSingleItem(tx, {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      customerPhone: subscription.customer.phone,
      servicePlanName: subscription.servicePlan.name,
      periodStart,
      periodEnd,
      issueDate,
      dueDate,
      billingAnchorDate,
      amount,
      isProrated: false,
      generatedAutomatically: false,
      notes: input.notes ?? `Invoice manual ${subscription.subscriptionNo}`,
    });

    return {
      invoice,
      subscription: {
        id: subscription.id,
        subscriptionNo: subscription.subscriptionNo,
        customerId: subscription.customerId,
      },
    };
  });
}

export async function generatePeriodicInvoices(input: {
  issueDate?: string;
  dueDate?: string;
  subscriptionIds?: string[];
  limit: number;
  notes?: string | null;
}) {
  const issueDate = parseDateInput(input.issueDate ?? new Date());

  return db.$transaction(async (tx) => {
    const subscriptions = await tx.subscription.findMany({
      where: {
        status: "active",
        ...(input.subscriptionIds?.length
          ? {
              id: {
                in: input.subscriptionIds,
              },
            }
          : {}),
      },
      include: {
        customer: true,
        servicePlan: true,
      },
      orderBy: [{ activationDate: "asc" }, { createdAt: "asc" }],
      take: input.limit,
    });

    const created = [];
    const skipped = [];

    for (const subscription of subscriptions) {
      const nextPeriod = getNextPeriodRange(subscription);
      const duplicate = await tx.invoice.findFirst({
        where: {
          subscriptionId: subscription.id,
          periodStart: nextPeriod.periodStart,
          periodEnd: nextPeriod.periodEnd,
          status: {
            not: "cancelled",
          },
        },
        select: {
          id: true,
          invoiceNo: true,
        },
      });

      if (duplicate) {
        skipped.push({
          subscriptionId: subscription.id,
          subscriptionNo: subscription.subscriptionNo,
          reason: `existing_invoice:${duplicate.invoiceNo}`,
        });
        continue;
      }

      const invoice = await createInvoiceWithSingleItem(tx, {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        customerPhone: subscription.customer.phone,
        servicePlanName: subscription.servicePlan.name,
        periodStart: nextPeriod.periodStart,
        periodEnd: nextPeriod.periodEnd,
        issueDate,
        dueDate: parseDateInput(input.dueDate ?? nextPeriod.periodEnd),
        billingAnchorDate: nextPeriod.billingAnchorDate,
        amount: subscription.servicePlan.priceMonthly,
        isProrated: false,
        generatedAutomatically: false,
        notes: input.notes ?? `Invoice periodik ${subscription.subscriptionNo}`,
      });

      created.push({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        subscriptionId: subscription.id,
        subscriptionNo: subscription.subscriptionNo,
      });
    }

    return {
      created,
      skipped,
    };
  });
}
