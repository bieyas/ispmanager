import { NotificationChannel, NotificationStatus, Prisma } from "@ispmanager/db";
import { addMonths, endOfPreviousDay, parseDateInput } from "./date.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateOnly(date: Date) {
  return parseDateInput(date);
}

function addDays(date: Date, days: number) {
  const next = toDateOnly(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function diffDaysInclusive(startDate: Date, endDate: Date) {
  const start = toDateOnly(startDate).getTime();
  const end = toDateOnly(endDate).getTime();
  return Math.floor((end - start) / DAY_IN_MS) + 1;
}

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatDateLabel(date: Date) {
  return toDateOnly(date).toISOString().slice(0, 10);
}

async function generateInvoiceNo(tx: Prisma.TransactionClient, issueDate: Date) {
  const dateSegment = formatDateYYYYMMDD(issueDate);
  const sameDayCount = await tx.invoice.count({
    where: {
      issueDate,
    },
  });

  return `INV-${dateSegment}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

function scheduleNotificationAt(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 1, 0, 0));
}

export function calculateProratedSubscriptionAmount(
  monthlyPrice: Prisma.Decimal | number | string,
  periodStart: Date,
  periodEnd: Date,
) {
  const baseAmount = new Prisma.Decimal(monthlyPrice);
  const fullCycleEnd = endOfPreviousDay(addMonths(periodStart, 1));
  const activeDays = diffDaysInclusive(periodStart, periodEnd);
  const fullCycleDays = diffDaysInclusive(periodStart, fullCycleEnd);

  return baseAmount.mul(activeDays).div(fullCycleDays).toDecimalPlaces(2);
}

type CreateInvoiceInput = {
  subscriptionId: string;
  customerId: string;
  customerPhone?: string | null;
  servicePlanName: string;
  periodStart: Date;
  periodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  billingAnchorDate: Date;
  amount: Prisma.Decimal | number | string;
  isProrated: boolean;
  generatedAutomatically: boolean;
  notes?: string | null;
};

export async function createInvoiceWithSingleItem(
  tx: Prisma.TransactionClient,
  input: CreateInvoiceInput,
) {
  const issueDate = toDateOnly(input.issueDate);
  const dueDate = toDateOnly(input.dueDate);
  const periodStart = toDateOnly(input.periodStart);
  const periodEnd = toDateOnly(input.periodEnd);
  const billingAnchorDate = toDateOnly(input.billingAnchorDate);
  const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(2);
  const invoiceNo = await generateInvoiceNo(tx, issueDate);
  const descriptionPrefix = input.isProrated ? "Biaya prorata" : "Biaya langganan";
  const lineDescription = `${descriptionPrefix} paket ${input.servicePlanName} periode ${formatDateLabel(
    periodStart,
  )} s/d ${formatDateLabel(periodEnd)}`;

  const invoice = await tx.invoice.create({
    data: {
      subscriptionId: input.subscriptionId,
      invoiceNo,
      periodStart,
      periodEnd,
      issueDate,
      dueDate,
      billingAnchorDate,
      isProrated: input.isProrated,
      generatedAutomatically: input.generatedAutomatically,
      subtotal: amount,
      discountAmount: new Prisma.Decimal(0),
      taxAmount: new Prisma.Decimal(0),
      totalAmount: amount,
      status: "issued",
      notes: input.notes ?? null,
      invoiceItems: {
        create: [
          {
            itemType: input.isProrated ? "subscription_prorate" : "subscription_monthly",
            description: lineDescription,
            qty: 1,
            unitPrice: amount,
            lineTotal: amount,
          },
        ],
      },
    },
    include: {
      invoiceItems: true,
    },
  });

  if (input.customerPhone) {
    const hMinus3 = addDays(dueDate, -3);
    const notificationPayload = {
      invoiceNo,
      dueDate: formatDateLabel(dueDate),
      amount: amount.toString(),
    };

    if (hMinus3.getTime() >= issueDate.getTime()) {
      await tx.notificationLog.create({
        data: {
          channel: NotificationChannel.whatsapp,
          eventType: "invoice_due_h_minus_3",
          customerId: input.customerId,
          invoiceId: invoice.id,
          target: input.customerPhone,
          scheduledAt: scheduleNotificationAt(hMinus3),
          status: NotificationStatus.pending,
          payloadSummary: notificationPayload,
        },
      });
    }

    await tx.notificationLog.create({
      data: {
        channel: NotificationChannel.whatsapp,
        eventType: "invoice_due_h_0",
        customerId: input.customerId,
        invoiceId: invoice.id,
        target: input.customerPhone,
        scheduledAt: scheduleNotificationAt(dueDate),
        status: NotificationStatus.pending,
        payloadSummary: notificationPayload,
      },
    });
  }

  return invoice;
}
