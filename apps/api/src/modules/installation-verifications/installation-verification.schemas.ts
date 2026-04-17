import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const listInstallationVerificationsQuerySchema = z.object({
  prospectId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
});

export const submitInstallationVerificationSchema = z.object({
  prospectId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  checklistSnapshot: z.any(),
  deviceSerialSnapshot: z.any().optional().nullable(),
  signalSnapshot: z.any().optional().nullable(),
  photoSummary: nullableString,
  verificationNotes: nullableString,
});

export const decideInstallationVerificationSchema = z.object({
  verificationNotes: nullableString,
});
