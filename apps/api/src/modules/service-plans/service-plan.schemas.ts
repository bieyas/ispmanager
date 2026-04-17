import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const createServicePlanSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: nullableString,
  downloadMbps: z.coerce.number().int().positive(),
  uploadMbps: z.coerce.number().int().positive(),
  priceMonthly: z.coerce.number().positive(),
  isActive: z.boolean().optional().default(true),
});

export const updateServicePlanSchema = createServicePlanSchema.partial();
