import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const createPaymentSchema = z
  .object({
    invoiceId: z.string().uuid().optional().nullable(),
    customerId: z.string().uuid().optional().nullable(),
    subscriptionId: z.string().uuid().optional().nullable(),
    paymentDate: z.string().date(),
    amount: z.coerce.number().positive().optional(),
    method: z.string().trim().min(1),
    channel: nullableString,
    referenceNo: nullableString,
    proofFileUrl: nullableString,
    sourceType: z.enum(["transfer", "field_collection"]),
    collectionNotes: nullableString,
    notes: nullableString,
  })
  .refine((value) => Boolean(value.invoiceId || value.customerId || value.subscriptionId), {
    message: "invoiceId, customerId, or subscriptionId is required",
    path: ["invoiceId"],
  });

export const verifyPaymentSchema = z.object({
  notes: nullableString,
});

export const rejectPaymentSchema = z.object({
  notes: nullableString,
});
