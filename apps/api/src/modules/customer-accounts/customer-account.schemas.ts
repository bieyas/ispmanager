import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const disableCustomerAccountSchema = z.object({
  reason: nullableString,
});
