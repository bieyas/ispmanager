import { TicketCategory, TicketPriority, TicketStatus } from "@ispmanager/db";
import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();

export const listTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedToUserId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const createTicketSchema = z.object({
  customerId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional().nullable(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.medium),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
});

export const assignTicketSchema = z.object({
  assignedToUserId: z.string().uuid().nullable(),
});

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  notes: nullableString,
});

export const addTicketCommentSchema = z.object({
  comment: z.string().trim().min(1),
  isInternal: z.boolean().optional().default(false),
});
