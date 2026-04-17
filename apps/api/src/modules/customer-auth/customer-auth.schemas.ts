import { z } from "zod";

export const customerLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const customerChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
