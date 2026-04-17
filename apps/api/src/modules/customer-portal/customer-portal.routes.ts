import { Router } from "express";
import { z } from "zod";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticateCustomer } from "../../middlewares/authenticate-customer.js";
import { addTicketCommentSchema, createTicketSchema } from "../tickets/ticket.schemas.js";
import { generateTicketNo, getTicketActorSummary, getTicketCommentActorSummary } from "../tickets/ticket.service.js";

export const customerPortalRouter = Router();

customerPortalRouter.use(authenticateCustomer);

customerPortalRouter.get("/overview", async (req, res, next) => {
  try {
    const customerId = req.currentCustomer!.customerId;

    const [subscriptions, invoices, tickets] = await Promise.all([
      db.subscription.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        include: {
          servicePlan: {
            select: {
              id: true,
              code: true,
              name: true,
              priceMonthly: true,
              downloadMbps: true,
              uploadMbps: true,
            },
          },
        },
      }),
      db.invoice.findMany({
        where: {
          subscription: {
            customerId,
          },
        },
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        take: 10,
        include: {
          payments: {
            select: {
              id: true,
              paymentNo: true,
              amount: true,
              status: true,
              paymentDate: true,
            },
          },
          subscription: {
            select: {
              id: true,
              subscriptionNo: true,
            },
          },
        },
      }),
      db.ticket.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
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
      }),
    ]);

    return sendOk(res, {
      customer: req.currentCustomer,
      subscriptions,
      invoices,
      tickets: tickets.map((ticket) => ({
        ...ticket,
        actor: getTicketActorSummary(ticket),
        comments: ticket.comments.map((comment) => ({
          ...comment,
          actor: getTicketCommentActorSummary(comment),
        })),
      })),
    }, "customer portal overview loaded");
  } catch (error) {
    return next(error);
  }
});

customerPortalRouter.get("/subscriptions", async (req, res, next) => {
  try {
    const subscriptions = await db.subscription.findMany({
      where: {
        customerId: req.currentCustomer!.customerId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        servicePlan: true,
        installationAddress: true,
      },
    });

    return sendOk(res, subscriptions, "customer subscriptions loaded");
  } catch (error) {
    return next(error);
  }
});

customerPortalRouter.get("/invoices", async (req, res, next) => {
  try {
    const invoices = await db.invoice.findMany({
      where: {
        subscription: {
          customerId: req.currentCustomer!.customerId,
        },
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      include: {
        invoiceItems: true,
        payments: true,
        subscription: {
          select: {
            id: true,
            subscriptionNo: true,
          },
        },
      },
    });

    return sendOk(res, invoices, "customer invoices loaded");
  } catch (error) {
    return next(error);
  }
});

customerPortalRouter.get("/tickets", async (req, res, next) => {
  try {
    const tickets = await db.ticket.findMany({
      where: {
        customerId: req.currentCustomer!.customerId,
      },
      orderBy: { createdAt: "desc" },
      include: {
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

    return sendOk(res, tickets.map((ticket) => ({
      ...ticket,
      actor: getTicketActorSummary(ticket),
      comments: ticket.comments.map((comment) => ({
        ...comment,
        actor: getTicketCommentActorSummary(comment),
      })),
    })), "customer tickets loaded");
  } catch (error) {
    return next(error);
  }
});

customerPortalRouter.post("/tickets", async (req, res, next) => {
  try {
    const parsed = createTicketSchema.omit({ customerId: true, assignedToUserId: true }).safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid customer ticket payload", parsed.error.flatten());
    }

    if (parsed.data.subscriptionId) {
      const subscription = await db.subscription.findFirst({
        where: {
          id: parsed.data.subscriptionId,
          customerId: req.currentCustomer!.customerId,
        },
        select: { id: true },
      });

      if (!subscription) {
        return sendError(res, 400, "Subscription not found");
      }
    }

    const ticket = await db.ticket.create({
      data: {
        ticketNo: await generateTicketNo(),
        customerId: req.currentCustomer!.customerId,
        subscriptionId: parsed.data.subscriptionId ?? null,
        createdByUserId: null,
        createdByCustomerUserId: req.currentCustomer!.id,
        category: parsed.data.category,
        priority: parsed.data.priority,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: "open",
        openedAt: new Date(),
      },
      include: {
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
    });

    return sendCreated(res, {
      ...ticket,
      actor: getTicketActorSummary(ticket),
    }, "customer ticket created");
  } catch (error) {
    return next(error);
  }
});

customerPortalRouter.post("/tickets/:id/comments", async (req, res, next) => {
  try {
    const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = addTicketCommentSchema.safeParse({
      ...req.body,
      isInternal: false,
    });

    if (!parsed.success) {
      return sendError(res, 400, "Invalid customer ticket comment payload", parsed.error.flatten());
    }

    const ticket = await db.ticket.findFirst({
      where: {
        id: ticketId,
        customerId: req.currentCustomer!.customerId,
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
        userId: null,
        customerUserId: req.currentCustomer!.id,
        comment: parsed.data.comment,
        isInternal: false,
      },
      include: {
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

    return sendCreated(res, {
      ...comment,
      actor: getTicketCommentActorSummary(comment),
    }, "customer ticket comment created");
  } catch (error) {
    return next(error);
  }
});

// Profile endpoints
customerPortalRouter.get("/profile", async (req, res, next) => {
  try {
    const customer = await db.customer.findUnique({
      where: { id: req.currentCustomer!.customerId },
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
        email: true,
        serviceAddresses: {
          select: {
            id: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            isPrimary: true,
          },
        },
      },
    });

    return sendOk(res, customer, "customer profile loaded");
  } catch (error) {
    return next(error);
  }
});

const updateCustomerProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
});

customerPortalRouter.put("/profile", async (req, res, next) => {
  try {
    const parsed = updateCustomerProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid profile update payload", parsed.error.flatten());
    }

    const customer = await db.customer.update({
      where: { id: req.currentCustomer!.customerId },
      data: {
        ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
      },
      select: {
        id: true,
        customerCode: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    return sendOk(res, customer, "customer profile updated");
  } catch (error) {
    return next(error);
  }
});

// Payment upload endpoint
const uploadPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentDate: z.string().date(),
  amount: z.number().positive(),
  method: z.string().trim().min(1),
  referenceNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

customerPortalRouter.post("/payments", async (req, res, next) => {
  try {
    const parsed = uploadPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid payment upload payload", parsed.error.flatten());
    }

    // Verify invoice belongs to customer
    const invoice = await db.invoice.findFirst({
      where: {
        id: parsed.data.invoiceId,
        subscription: {
          customerId: req.currentCustomer!.customerId,
        },
      },
      select: { id: true, totalAmount: true },
    });

    if (!invoice) {
      return sendError(res, 400, "Invoice not found");
    }

    // Create payment as pending
    const payment = await db.payment.create({
      data: {
        customerId: req.currentCustomer!.customerId,
        invoiceId: parsed.data.invoiceId,
        paymentNo: `CUSTOMER-${Date.now()}`,
        paymentDate: new Date(parsed.data.paymentDate),
        amount: parsed.data.amount,
        method: parsed.data.method,
        referenceNo: parsed.data.referenceNo || null,
        notes: parsed.data.notes || null,
        status: "pending",
      },
      select: {
        id: true,
        paymentNo: true,
        paymentDate: true,
        amount: true,
        method: true,
        status: true,
      },
    });

    return sendCreated(res, payment, "customer payment uploaded - pending verification");
  } catch (error) {
    return next(error);
  }
});
