import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const createManualInvoiceSchema = z
  .object({
    subscriptionId: z.string().uuid(),
    periodStart: z.string().date().optional(),
    periodEnd: z.string().date().optional(),
    issueDate: z.string().date().optional(),
    dueDate: z.string().date().optional(),
    billingAnchorDate: z.string().date().optional(),
    amount: z.coerce.number().positive().optional(),
    notes: nullableString,
  })
  .superRefine((value, context) => {
    if ((value.periodStart && !value.periodEnd) || (!value.periodStart && value.periodEnd)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "periodStart dan periodEnd harus diisi bersama",
        path: value.periodStart ? ["periodEnd"] : ["periodStart"],
      });
    }

    if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "periodEnd tidak boleh lebih kecil dari periodStart",
        path: ["periodEnd"],
      });
    }
  });

export const generatePeriodicInvoicesSchema = z.object({
  issueDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  subscriptionIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  notes: nullableString,
});

export const cancelInvoiceSchema = z.object({
  reason: nullableString,
});
