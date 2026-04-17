import { Prisma } from "@ispmanager/db";
import { db } from "../../lib/db.js";
import { parseDateInput } from "../../lib/date.js";

type CreatePaymentInput = {
  invoiceId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  paymentDate: string;
  amount?: number;
  method: string;
  channel?: string | null;
  referenceNo?: string | null;
  proofFileUrl?: string | null;
  sourceType: "transfer" | "field_collection";
  collectionNotes?: string | null;
  notes?: string | null;
  createdByUserId: string;
};

type VerifyPaymentInput = {
  paymentId: string;
  confirmedByUserId: string;
  notes?: string | null;
};

type RejectPaymentInput = {
  paymentId: string;
  rejectedByUserId: string;
  notes?: string | null;
};

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generatePaymentNo(tx: Prisma.TransactionClient, paymentDate: Date) {
  const prefix = formatDateYYYYMMDD(paymentDate);
  const sameDayCount = await tx.payment.count({
    where: {
      paymentDate,
    },
  });

  return `PAY-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = parseDateInput(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getOutstandingAmount(
  invoice: {
    totalAmount: Prisma.Decimal;
    payments: Array<{ amount: Prisma.Decimal }>;
  },
) {
  const confirmedTotal = invoice.payments.reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));
  return invoice.totalAmount.minus(confirmedTotal).toDecimalPlaces(2);
}

async function generateCashTransactionNo(tx: Prisma.TransactionClient, transactionDate: Date) {
  const prefix = formatDateYYYYMMDD(transactionDate);
  const sameDayCount = await tx.cashTransaction.count({
    where: {
      transactionDate,
    },
  });

  return `CASHIN-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

function resolveCashCategoryCode(itemTypes: string[]) {
  if (itemTypes.some((itemType) => itemType.includes("installation"))) {
    return "installation_fee";
  }

  return "subscription_income";
}

async function ensureCashCategory(
  tx: Prisma.TransactionClient,
  categoryCode: string,
) {
  const existingCategory = await tx.cashCategory.findUnique({
    where: { code: categoryCode },
  });

  if (existingCategory) {
    return existingCategory;
  }

  const fallbackDefinitions: Record<
    string,
    {
      name: string;
      description: string;
      defaultKeteranganTemplate: string;
    }
  > = {
    installation_fee: {
      name: "Biaya Instalasi",
      description: "Pemasukan biaya instalasi pelanggan baru.",
      defaultKeteranganTemplate: "Pemasukan biaya instalasi pelanggan",
    },
    subscription_income: {
      name: "Pemasukan Langganan",
      description: "Pemasukan pembayaran tagihan langganan internet.",
      defaultKeteranganTemplate: "Pembayaran langganan pelanggan",
    },
  };

  const fallback = fallbackDefinitions[categoryCode] ?? {
    name: "Pemasukan Lain-Lain",
    description: "Pemasukan lain-lain.",
    defaultKeteranganTemplate: "Pemasukan lain-lain",
  };

  return tx.cashCategory.create({
    data: {
      code: categoryCode,
      name: fallback.name,
      type: "cash_in",
      isActive: true,
      description: fallback.description,
      defaultKeteranganTemplate: fallback.defaultKeteranganTemplate,
    },
  });
}

async function createCashTransactionFromPayment(
  tx: Prisma.TransactionClient,
  input: {
    payment: {
      id: string;
      paymentNo: string;
      paymentDate: Date;
      amount: Prisma.Decimal;
      method: string;
      referenceNo: string | null;
      proofFileUrl: string | null;
      customer: {
        customerCode: string;
        fullName: string;
      };
      invoice: {
        invoiceNo: string;
        invoiceItems: Array<{
          itemType: string;
          description: string;
        }>;
      };
    };
    approvedByUserId: string;
  },
) {
  const existingCashTransaction = await tx.cashTransaction.findUnique({
    where: {
      paymentId: input.payment.id,
    },
  });

  if (existingCashTransaction) {
    return existingCashTransaction;
  }

  const categoryCode = resolveCashCategoryCode(input.payment.invoice.invoiceItems.map((item) => item.itemType));
  const cashCategory = await ensureCashCategory(tx, categoryCode);
  const transactionNo = await generateCashTransactionNo(tx, input.payment.paymentDate);
  const keterangan =
    categoryCode === "installation_fee"
      ? `Pembayaran instalasi ${input.payment.customer.customerCode}`
      : `Pembayaran langganan ${input.payment.customer.customerCode}`;

  return tx.cashTransaction.create({
    data: {
      paymentId: input.payment.id,
      transactionNo,
      transactionDate: input.payment.paymentDate,
      type: "cash_in",
      cashCategoryId: cashCategory.id,
      amount: input.payment.amount,
      method: input.payment.method,
      referenceNo: input.payment.referenceNo ?? input.payment.paymentNo,
      proofFileUrl: input.payment.proofFileUrl,
      keterangan,
      description: `Auto-post dari payment ${input.payment.paymentNo} untuk invoice ${input.payment.invoice.invoiceNo}`,
      createdByUserId: input.approvedByUserId,
      approvedByUserId: input.approvedByUserId,
      approvedAt: new Date(),
      status: "confirmed",
    },
  });
}

export async function createPayment(input: CreatePaymentInput) {
  const paymentDate = parseDateInput(input.paymentDate);

  return db.$transaction(async (tx) => {
    let invoice = null as
      | ({
          customerId: string;
          subscriptionId: string;
          totalAmount: Prisma.Decimal;
          status: string;
          payments: Array<{ id: string; amount: Prisma.Decimal }>;
        } & {
          id: string;
          invoiceNo: string;
        })
      | null;

    if (input.invoiceId) {
      invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
        include: {
          payments: {
            where: { status: "confirmed" },
            select: {
              id: true,
              amount: true,
            },
          },
          subscription: {
            select: {
              id: true,
              customerId: true,
            },
          },
        },
      }).then((record) =>
        record
          ? {
              id: record.id,
              invoiceNo: record.invoiceNo,
              customerId: record.subscription.customerId,
              subscriptionId: record.subscription.id,
              totalAmount: record.totalAmount,
              status: record.status,
              payments: record.payments,
            }
          : null,
      );
    } else {
      invoice = await tx.invoice.findFirst({
        where: {
          status: {
            in: ["issued", "overdue"],
          },
          subscription: {
            customerId: input.customerId ?? undefined,
            id: input.subscriptionId ?? undefined,
          },
        },
        include: {
          payments: {
            where: { status: "confirmed" },
            select: {
              id: true,
              amount: true,
            },
          },
          subscription: {
            select: {
              id: true,
              customerId: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      }).then((record) =>
        record
          ? {
              id: record.id,
              invoiceNo: record.invoiceNo,
              customerId: record.subscription.customerId,
              subscriptionId: record.subscription.id,
              totalAmount: record.totalAmount,
              status: record.status,
              payments: record.payments,
            }
          : null,
      );
    }

    if (!invoice) {
      throw new Error("Active unpaid invoice not found");
    }

    if (!["issued", "overdue"].includes(invoice.status)) {
      throw new Error("Invoice is not open for payment");
    }

    const outstandingAmount = getOutstandingAmount(invoice);

    if (outstandingAmount.lte(0)) {
      throw new Error("Invoice has already been fully paid");
    }

    const amount = new Prisma.Decimal(input.amount ?? outstandingAmount).toDecimalPlaces(2);

    if (amount.gt(outstandingAmount)) {
      throw new Error("Payment amount exceeds invoice outstanding amount");
    }

    const paymentNo = await generatePaymentNo(tx, paymentDate);
    const payment = await tx.payment.create({
      data: {
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        paymentNo,
        paymentDate,
        amount,
        method: input.method,
        channel: input.channel ?? null,
        referenceNo: input.referenceNo ?? null,
        proofFileUrl: input.proofFileUrl ?? null,
        status: "pending",
        collectedByUserId: input.sourceType === "field_collection" ? input.createdByUserId : null,
        collectionNotes: input.sourceType === "field_collection" ? input.collectionNotes ?? null : null,
        notes: input.notes ?? null,
      },
    });

    return {
      payment,
      linkedInvoice: {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        customerId: invoice.customerId,
        subscriptionId: invoice.subscriptionId,
        outstandingAmount,
      },
    };
  });
}

export async function verifyPaymentAndApplyEffects(input: VerifyPaymentInput) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        customer: true,
        invoice: {
          include: {
            subscription: true,
            invoiceItems: {
              select: {
                itemType: true,
                description: true,
              },
            },
            payments: {
              where: {
                status: "confirmed",
              },
              select: {
                id: true,
                amount: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be verified");
    }

    const now = new Date();
    const confirmedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "confirmed",
        confirmedByUserId: input.confirmedByUserId,
        confirmedAt: now,
        notes: input.notes ?? payment.notes,
      },
    });

    const confirmedTotal = payment.invoice.payments
      .reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0))
      .plus(confirmedPayment.amount);
    const invoiceFullyPaid = confirmedTotal.gte(payment.invoice.totalAmount);

    const invoice = invoiceFullyPaid
      ? await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: "paid",
            overdueAt: null,
          },
        })
      : payment.invoice;

    let renewal:
      | {
          id: string;
          renewalNo: string;
          status: string;
          oldPeriodEnd: Date;
          newPeriodEnd: Date;
          subscriptionId: string;
        }
      | null = null;
    let subscription = payment.invoice.subscription;
    let cashTransaction = null;

    if (invoiceFullyPaid) {
      const pendingRenewal = await tx.subscriptionRenewal.findFirst({
        where: {
          invoiceId: payment.invoiceId,
          status: "pending_payment",
        },
        select: {
          id: true,
          renewalNo: true,
          status: true,
          oldPeriodEnd: true,
          newPeriodEnd: true,
          subscriptionId: true,
        },
      });

      if (pendingRenewal) {
        renewal = await tx.subscriptionRenewal.update({
          where: { id: pendingRenewal.id },
          data: {
            status: "confirmed",
            paymentId: confirmedPayment.id,
            confirmedAt: now,
          },
          select: {
            id: true,
            renewalNo: true,
            status: true,
            oldPeriodEnd: true,
            newPeriodEnd: true,
            subscriptionId: true,
          },
        });

        subscription = await tx.subscription.update({
          where: { id: renewal.subscriptionId },
          data: {
            currentPeriodStart: addDays(renewal.oldPeriodEnd, 1),
            currentPeriodEnd: renewal.newPeriodEnd,
          },
        });
      }
    }

    cashTransaction = await createCashTransactionFromPayment(tx, {
      payment: {
        id: confirmedPayment.id,
        paymentNo: confirmedPayment.paymentNo,
        paymentDate: confirmedPayment.paymentDate,
        amount: confirmedPayment.amount,
        method: confirmedPayment.method,
        referenceNo: confirmedPayment.referenceNo,
        proofFileUrl: confirmedPayment.proofFileUrl,
        customer: {
          customerCode: payment.customer.customerCode,
          fullName: payment.customer.fullName,
        },
        invoice: {
          invoiceNo: payment.invoice.invoiceNo,
          invoiceItems: payment.invoice.invoiceItems,
        },
      },
      approvedByUserId: input.confirmedByUserId,
    });

    return {
      paymentBefore: payment,
      payment: confirmedPayment,
      invoice,
      renewal,
      subscription,
      cashTransaction,
      invoiceFullyPaid,
      confirmedTotal,
    };
  });
}

export async function rejectPayment(input: RejectPaymentInput) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be rejected");
    }

    const rejectedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "rejected",
        confirmedByUserId: input.rejectedByUserId,
        confirmedAt: new Date(),
        notes: input.notes ?? payment.notes,
      },
    });

    return {
      paymentBefore: payment,
      payment: rejectedPayment,
      invoice: payment.invoice,
    };
  });
}
