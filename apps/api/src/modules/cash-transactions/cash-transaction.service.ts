import { Prisma } from "@ispmanager/db";
import { db } from "../../lib/db.js";
import { parseDateInput } from "../../lib/date.js";

type CreateManualCashTransactionInput = {
  transactionDate: string;
  type: "cash_in" | "cash_out";
  cashCategoryId: string;
  amount: number;
  method: string;
  referenceNo?: string | null;
  proofFileUrl?: string | null;
  keterangan: string;
  description?: string | null;
  createdByUserId: string;
};

type UpdateManualCashTransactionInput = Partial<CreateManualCashTransactionInput> & {
  transactionId: string;
};

type ConfirmManualCashTransactionInput = {
  transactionId: string;
  approvedByUserId: string;
  approvalNote?: string | null;
};

type CancelManualCashTransactionInput = {
  transactionId: string;
  approvedByUserId: string;
  approvalNote?: string | null;
};

type CashTransactionListFilters = {
  dateFrom?: string;
  dateTo?: string;
  categoryCode?: string;
  status?: "draft" | "confirmed" | "cancelled";
  type?: "cash_in" | "cash_out";
};

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateCashTransactionNo(tx: Prisma.TransactionClient, transactionDate: Date) {
  const prefix = formatDateYYYYMMDD(transactionDate);
  const sameDayCount = await tx.cashTransaction.count({
    where: {
      transactionDate,
    },
  });

  return `CASH-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

function buildApprovalDescription(existingDescription: string | null, status: "confirmed" | "cancelled", approvalNote?: string | null) {
  const normalizedNote = approvalNote?.trim();
  const noteLabel = status === "confirmed" ? "Approval note" : "Cancel note";
  const noteEntry = normalizedNote ? `[${noteLabel}] ${normalizedNote}` : null;

  if (existingDescription && noteEntry) {
    return `${existingDescription}\n${noteEntry}`;
  }

  if (noteEntry) {
    return noteEntry;
  }

  return existingDescription;
}

export function buildCashTransactionWhere(filters: CashTransactionListFilters) {
  return {
    transactionDate: {
      gte: filters.dateFrom ? parseDateInput(filters.dateFrom) : undefined,
      lte: filters.dateTo ? parseDateInput(filters.dateTo) : undefined,
    },
    status: filters.status,
    type: filters.type,
    cashCategory: filters.categoryCode
      ? {
          code: filters.categoryCode,
        }
      : undefined,
  };
}

export async function listCashTransactions(filters: CashTransactionListFilters, userScope?: Prisma.CashTransactionWhereInput) {
  const where: Prisma.CashTransactionWhereInput = {
    ...buildCashTransactionWhere(filters),
    ...(userScope ?? {}),
  };

  return db.cashTransaction.findMany({
    where,
    take: 200,
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    include: {
      cashCategory: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
        },
      },
      payment: {
        select: {
          id: true,
          paymentNo: true,
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              subscription: {
                select: {
                  customer: {
                    select: {
                      customerCode: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      createdByUser: {
        select: {
          fullName: true,
        },
      },
      approvedByUser: {
        select: {
          fullName: true,
        },
      },
    },
  });
}

export async function createManualCashTransaction(input: CreateManualCashTransactionInput) {
  const transactionDate = parseDateInput(input.transactionDate);

  return db.$transaction(async (tx) => {
    const category = await tx.cashCategory.findUnique({
      where: { id: input.cashCategoryId },
    });

    if (!category || !category.isActive) {
      throw new Error("Cash category not found or inactive");
    }

    if (category.type !== input.type) {
      throw new Error("Cash category type does not match transaction type");
    }

    const transactionNo = await generateCashTransactionNo(tx, transactionDate);

    return tx.cashTransaction.create({
      data: {
        transactionNo,
        transactionDate,
        type: input.type,
        cashCategoryId: input.cashCategoryId,
        amount: new Prisma.Decimal(input.amount).toDecimalPlaces(2),
        method: input.method,
        referenceNo: input.referenceNo ?? null,
        proofFileUrl: input.proofFileUrl ?? null,
        keterangan: input.keterangan,
        description: input.description ?? null,
        createdByUserId: input.createdByUserId,
        status: "draft",
      },
    });
  });
}

export async function updateManualCashTransaction(input: UpdateManualCashTransactionInput) {
  return db.$transaction(async (tx) => {
    const existingTransaction = await tx.cashTransaction.findUnique({
      where: { id: input.transactionId },
      include: {
        cashCategory: true,
      },
    });

    if (!existingTransaction) {
      throw new Error("Cash transaction not found");
    }

    if (existingTransaction.paymentId) {
      throw new Error("Auto-posted cash transaction cannot be edited manually");
    }

    if (existingTransaction.status !== "draft") {
      throw new Error("Only draft cash transactions can be updated");
    }

    let nextCategoryId = input.cashCategoryId ?? existingTransaction.cashCategoryId;
    let nextType = input.type ?? existingTransaction.type;

    if (input.cashCategoryId) {
      const category = await tx.cashCategory.findUnique({
        where: { id: input.cashCategoryId },
      });

      if (!category || !category.isActive) {
        throw new Error("Cash category not found or inactive");
      }

      if (category.type !== nextType) {
        throw new Error("Cash category type does not match transaction type");
      }
    } else if (input.type && input.type !== existingTransaction.type) {
      if (existingTransaction.cashCategory.type !== input.type) {
        throw new Error("Existing cash category type does not match updated transaction type");
      }
    }

    return tx.cashTransaction.update({
      where: { id: input.transactionId },
      data: {
        transactionDate: input.transactionDate ? parseDateInput(input.transactionDate) : undefined,
        type: nextType,
        cashCategoryId: nextCategoryId,
        amount: input.amount === undefined ? undefined : new Prisma.Decimal(input.amount).toDecimalPlaces(2),
        method: input.method,
        referenceNo: input.referenceNo === undefined ? undefined : input.referenceNo,
        proofFileUrl: input.proofFileUrl === undefined ? undefined : input.proofFileUrl,
        keterangan: input.keterangan,
        description: input.description === undefined ? undefined : input.description,
      },
    });
  });
}

export async function confirmManualCashTransaction(input: ConfirmManualCashTransactionInput) {
  return db.$transaction(async (tx) => {
    const existingTransaction = await tx.cashTransaction.findUnique({
      where: { id: input.transactionId },
    });

    if (!existingTransaction) {
      throw new Error("Cash transaction not found");
    }

    if (existingTransaction.paymentId) {
      throw new Error("Auto-posted cash transaction is confirmed automatically");
    }

    if (existingTransaction.status !== "draft") {
      throw new Error("Only draft cash transactions can be confirmed");
    }

    if (existingTransaction.type === "cash_out" && !input.approvalNote?.trim()) {
      throw new Error("Approval note is required for cash out confirmation");
    }

    return tx.cashTransaction.update({
      where: { id: input.transactionId },
      data: {
        approvedByUserId: input.approvedByUserId,
        approvedAt: new Date(),
        status: "confirmed",
        description: buildApprovalDescription(existingTransaction.description, "confirmed", input.approvalNote),
      },
    });
  });
}

export async function cancelManualCashTransaction(input: CancelManualCashTransactionInput) {
  return db.$transaction(async (tx) => {
    const existingTransaction = await tx.cashTransaction.findUnique({
      where: { id: input.transactionId },
    });

    if (!existingTransaction) {
      throw new Error("Cash transaction not found");
    }

    if (existingTransaction.paymentId) {
      throw new Error("Auto-posted cash transaction cannot be cancelled manually");
    }

    if (existingTransaction.status !== "draft") {
      throw new Error("Only draft cash transactions can be cancelled");
    }

    if (existingTransaction.type === "cash_out" && !input.approvalNote?.trim()) {
      throw new Error("Approval note is required for cash out cancellation");
    }

    return tx.cashTransaction.update({
      where: { id: input.transactionId },
      data: {
        status: "cancelled",
        approvedByUserId: input.approvedByUserId,
        approvedAt: new Date(),
        description: buildApprovalDescription(existingTransaction.description, "cancelled", input.approvalNote),
      },
    });
  });
}
