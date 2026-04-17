import { CashTransactionStatus, CashTransactionType } from "@ispmanager/db";
import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const cashTransactionQuerySchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  categoryCode: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CashTransactionStatus).optional(),
  type: z.nativeEnum(CashTransactionType).optional(),
});

export const createCashTransactionSchema = z.object({
  transactionDate: z.string().date(),
  type: z.nativeEnum(CashTransactionType),
  cashCategoryId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.string().trim().min(1),
  referenceNo: nullableString,
  proofFileUrl: nullableString,
  keterangan: z.string().trim().min(1).max(255),
  description: nullableString,
});

export const updateCashTransactionSchema = createCashTransactionSchema.partial();

export const confirmCashTransactionSchema = z.object({
  approvalNote: nullableString,
});

export const cancelCashTransactionSchema = z.object({
  approvalNote: nullableString,
});
