import { Prisma } from "@ispmanager/db";
import { db } from "../../lib/db.js";
import { addMonths, endOfPreviousDay, parseDateInput } from "../../lib/date.js";
import { createInvoiceWithSingleItem } from "../../lib/billing.js";

type CreateRenewalInput = {
  subscriptionId: string;
  processedByUserId: string;
  durationMonth: number;
  issueDate?: string;
  dueDate?: string | null;
  notes?: string | null;
};

function addDays(date: Date, days: number) {
  const next = parseDateInput(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateRenewalNo(tx: Prisma.TransactionClient, issueDate: Date) {
  const prefix = formatDateYYYYMMDD(issueDate);
  const sameDayCount = await tx.subscriptionRenewal.count({
    where: {
      createdAt: {
        gte: new Date(Date.UTC(issueDate.getUTCFullYear(), issueDate.getUTCMonth(), issueDate.getUTCDate())),
        lt: new Date(Date.UTC(issueDate.getUTCFullYear(), issueDate.getUTCMonth(), issueDate.getUTCDate() + 1)),
      },
    },
  });

  return `RNL-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

export async function createRenewalWithInvoice(input: CreateRenewalInput) {
  const issueDate = parseDateInput(input.issueDate ?? new Date());
  const dueDate = input.dueDate ? parseDateInput(input.dueDate) : issueDate;

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
      throw new Error("Only active subscriptions can be renewed");
    }

    const nextPeriodStart = addDays(subscription.currentPeriodEnd, 1);
    const newPeriodEnd = endOfPreviousDay(addMonths(nextPeriodStart, input.durationMonth));
    const amount = new Prisma.Decimal(subscription.servicePlan.priceMonthly)
      .mul(input.durationMonth)
      .toDecimalPlaces(2);
    const invoice = await createInvoiceWithSingleItem(tx, {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      customerPhone: subscription.customer.phone,
      servicePlanName: subscription.servicePlan.name,
      periodStart: nextPeriodStart,
      periodEnd: newPeriodEnd,
      issueDate,
      dueDate,
      billingAnchorDate: dueDate,
      amount,
      isProrated: false,
      generatedAutomatically: false,
      notes: input.notes ?? `Invoice renewal ${subscription.subscriptionNo}`,
    });
    const renewalNo = await generateRenewalNo(tx, issueDate);

    const renewal = await tx.subscriptionRenewal.create({
      data: {
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        processedByUserId: input.processedByUserId,
        renewalNo,
        oldPeriodEnd: subscription.currentPeriodEnd,
        newPeriodEnd,
        durationMonth: input.durationMonth,
        amount,
        status: "pending_payment",
        notes: input.notes ?? null,
      },
    });

    return {
      renewal,
      invoice,
      subscription: {
        id: subscription.id,
        subscriptionNo: subscription.subscriptionNo,
        customerId: subscription.customerId,
      },
    };
  });
}
