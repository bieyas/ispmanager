import { CustomerStatus } from "@ispmanager/db";
import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  identityNo: nullableString,
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  notes: nullableString,
});

export const listCustomersQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQueryInput = z.infer<typeof listCustomersQuerySchema>;
