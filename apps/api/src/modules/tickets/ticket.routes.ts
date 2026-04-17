import { Router } from "express";
import { Prisma, TicketStatus } from "@ispmanager/db";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { addTicketCommentSchema, assignTicketSchema, createTicketSchema, listTicketsQuerySchema, updateTicketStatusSchema } from "./ticket.schemas.js";
import { generateTicketNo, getTicketActorSummary, getTicketCommentActorSummary } from "./ticket.service.js";

export const ticketRouter = Router();

function getTicketScope(req: Express.Request): Prisma.TicketWhereInput | null {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return {};
  }

  return {
    OR: [
      {
        customer: {
          activatedFromProspect: {
            createdByUserId: currentUser.id,
          },
        },
      },
      {
        assignedToUserId: currentUser.id,
      },
      {
        createdByUserId: currentUser.id,
      },
    ],
  };
}

ticketRouter.use(authenticate);

ticketRouter.get("/", authorize("tickets.list"), async (req, res, next) => {
  try {
    const parsed = listTicketsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid ticket query", parsed.error.flatten());
    }

    const scope = getTicketScope(req);
    const where: Prisma.TicketWhereInput = {
      ...(scope ?? {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.assignedToUserId ? { assignedToUserId: parsed.data.assignedToUserId } : {}),
      ...(parsed.data.customerId ? { customerId: parsed.data.customerId } : {}),
    };

    const [totalItems, items] = await Promise.all([
      db.ticket.count({ where }),
      db.ticket.findMany({
        where,
        skip: (parsed.data.page - 1) * parsed.data.pageSize,
        take: parsed.data.pageSize,
        orderBy: [{ createdAt: "desc" }, { openedAt: "desc" }],
        select: {
          id: true,
          ticketNo: true,
          subject: true,
          status: true,
          category: true,
          priority: true,
          openedAt: true,
          customer: {
            select: {
              id: true,
              customerCode: true,
              fullName: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          createdByCustomerUser: {
            select: {
              id: true,
              username: true,
              customer: {
                select: {
                  customerCode: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return sendOk(res, {
      items: items.map((item) => ({
        ...item,
        actor: getTicketActorSummary(item),
      })),
      meta: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / parsed.data.pageSize)),
      },
    }, "tickets loaded");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.get("/:id", authorize("tickets.read"), async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getTicketScope(req);
    const ticket = await db.ticket.findFirst({
      where: {
        id: ticketId,
        ...(scope ?? {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
            phone: true,
          },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNo: true,
            status: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        createdByCustomerUser: {
          select: {
            id: true,
            username: true,
            customer: {
              select: {
                customerCode: true,
                fullName: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
            customerUser: {
              select: {
                id: true,
                username: true,
                customer: {
                  select: {
                    customerCode: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return sendError(res, 404, "Ticket not found");
    }

    return sendOk(res, {
      ...ticket,
      actor: getTicketActorSummary(ticket),
      comments: ticket.comments.map((comment) => ({
        ...comment,
        actor: getTicketCommentActorSummary(comment),
      })),
    }, "ticket loaded");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.post("/", authorize("tickets.create"), async (req, res, next) => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid ticket payload", parsed.error.flatten());
    }

    const customer = await db.customer.findUnique({
      where: { id: parsed.data.customerId },
      include: {
        activatedFromProspect: {
          select: {
            createdByUserId: true,
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, 404, "Customer not found");
    }

    if (req.currentUser?.role.code === "teknisi" && customer.activatedFromProspect.createdByUserId !== req.currentUser.id) {
      return sendError(res, 403, "Forbidden");
    }

    if (parsed.data.subscriptionId) {
      const subscription = await db.subscription.findFirst({
        where: {
          id: parsed.data.subscriptionId,
          customerId: parsed.data.customerId,
        },
        select: { id: true },
      });

      if (!subscription) {
        return sendError(res, 400, "Subscription not found for this customer");
      }
    }

    const ticket = await db.ticket.create({
      data: {
        ticketNo: await generateTicketNo(),
        customerId: parsed.data.customerId,
        subscriptionId: parsed.data.subscriptionId ?? null,
        createdByUserId: req.currentUser!.id,
        createdByCustomerUserId: null,
        assignedToUserId: parsed.data.assignedToUserId ?? null,
        category: parsed.data.category,
        priority: parsed.data.priority,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: TicketStatus.open,
        openedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "tickets",
      action: "create",
      entityType: "ticket",
      entityId: ticket.id,
      newValues: ticket,
    });

    return sendCreated(res, ticket, "ticket created");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.post("/:id/assign", authorize("tickets.assign"), async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = assignTicketSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid ticket assign payload", parsed.error.flatten());
    }

    const existingTicket = await db.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return sendError(res, 404, "Ticket not found");
    }

    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToUserId: parsed.data.assignedToUserId,
        status: parsed.data.assignedToUserId ? TicketStatus.assigned : existingTicket.status,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "tickets",
      action: "assign",
      entityType: "ticket",
      entityId: ticket.id,
      oldValues: existingTicket,
      newValues: ticket,
    });

    return sendOk(res, ticket, "ticket assigned");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.patch("/:id/status", authorize("tickets.update_status"), async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = updateTicketStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid ticket status payload", parsed.error.flatten());
    }

    const scope = getTicketScope(req);
    const existingTicket = await db.ticket.findFirst({
      where: {
        id: ticketId,
        ...(scope ?? {}),
      },
    });

    if (!existingTicket) {
      return sendError(res, 404, "Ticket not found");
    }

    const now = new Date();
    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        status: parsed.data.status,
        resolvedAt: parsed.data.status === TicketStatus.resolved ? now : existingTicket.resolvedAt,
        closedAt: parsed.data.status === TicketStatus.closed ? now : existingTicket.closedAt,
      },
    });

    if (parsed.data.notes) {
      await db.ticketComment.create({
        data: {
          ticketId,
          userId: req.currentUser!.id,
          customerUserId: null,
          comment: parsed.data.notes,
          isInternal: true,
        },
      });
    }

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "tickets",
      action: "update_status",
      entityType: "ticket",
      entityId: ticket.id,
      oldValues: existingTicket,
      newValues: ticket,
    });

    return sendOk(res, ticket, "ticket status updated");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.post("/:id/comments", authorize("tickets.comment"), async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = addTicketCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid ticket comment payload", parsed.error.flatten());
    }

    const scope = getTicketScope(req);
    const ticket = await db.ticket.findFirst({
      where: {
        id: ticketId,
        ...(scope ?? {}),
      },
      select: {
        id: true,
      },
    });

    if (!ticket) {
      return sendError(res, 404, "Ticket not found");
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId,
        userId: req.currentUser!.id,
        customerUserId: null,
        comment: parsed.data.comment,
        isInternal: parsed.data.isInternal,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        customerUser: {
          select: {
            id: true,
            username: true,
            customer: {
              select: {
                customerCode: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "tickets",
      action: "comment",
      entityType: "ticket_comment",
      entityId: comment.id,
      newValues: comment,
    });

    return sendCreated(res, {
      ...comment,
      actor: getTicketCommentActorSummary(comment),
    }, "ticket comment created");
  } catch (error) {
    return next(error);
  }
});

ticketRouter.post("/:id/close", authorize("tickets.close"), async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getTicketScope(req);
    const existingTicket = await db.ticket.findFirst({
      where: {
        id: ticketId,
        ...(scope ?? {}),
      },
    });

    if (!existingTicket) {
      return sendError(res, 404, "Ticket not found");
    }

    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.closed,
        closedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "tickets",
      action: "close",
      entityType: "ticket",
      entityId: ticket.id,
      oldValues: existingTicket,
      newValues: ticket,
    });

    return sendOk(res, ticket, "ticket closed");
  } catch (error) {
    return next(error);
  }
});
