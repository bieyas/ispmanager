import { WorkOrderStatus } from "@ispmanager/db";
import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const listWorkOrdersQuerySchema = z.object({
  status: z.nativeEnum(WorkOrderStatus).optional(),
  sourceType: z.string().trim().min(1).optional(),
  assignedToUserId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const createWorkOrderSchema = z.object({
  sourceType: z.string().trim().min(1),
  sourceId: z.string().uuid().optional().nullable(),
  prospectId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  subscriptionId: z.string().uuid().optional().nullable(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string().date().optional().nullable(),
  notes: nullableString,
});

export const updateWorkOrderSchema = z.object({
  assignedToUserId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string().date().optional().nullable(),
  visitResult: nullableString,
  installationChecklistJson: z.any().optional().nullable(),
  deviceSerialJson: z.any().optional().nullable(),
  signalMetricsJson: z.any().optional().nullable(),
  status: z.nativeEnum(WorkOrderStatus).optional(),
  notes: nullableString,
});

export const closeWorkOrderSchema = z.object({
  visitResult: nullableString,
  notes: nullableString,
});

export const uploadWorkOrderAttachmentSchema = z.object({
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1).max(120),
  contentBase64: z.string().trim().min(1),
});
