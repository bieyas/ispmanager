import { z } from "zod";

export const listSubscriptionsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
