import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const createRenewalSchema = z.object({
  subscriptionId: z.string().uuid(),
  durationMonth: z.coerce.number().int().positive().default(1),
  issueDate: z.string().date().optional(),
  dueDate: z.string().date().optional().nullable(),
  notes: nullableString,
});
