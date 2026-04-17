import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { listCustomersQuerySchema, updateCustomerSchema } from "./customer.schemas.js";

export const customerRouter = Router();

function getCustomerScope(req: Express.Request) {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return { deletedAt: null };
  }

  return {
    deletedAt: null,
    activatedFromProspect: {
      createdByUserId: currentUser.id,
    },
  };
}

customerRouter.use(authenticate);

customerRouter.get("/", authorize("customers.list"), async (req, res, next) => {
  try {
    const scope = getCustomerScope(req);
    const parsedQuery = listCustomersQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return sendError(res, 400, "Invalid customer query", parsedQuery.error.flatten());
    }

    const { q, status, page, pageSize } = parsedQuery.data;
    const where = {
      ...(scope ?? {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { customerCode: { contains: q, mode: "insensitive" as const } },
              { fullName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [totalItems, customers] = await Promise.all([
      db.customer.count({
        where,
      }),
      db.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { fullName: "asc" }],
        select: {
          id: true,
          customerCode: true,
          fullName: true,
          phone: true,
          status: true,
          activatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return sendOk(
      res,
      {
        items: customers,
        meta: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          q: q ?? "",
          status: status ?? "",
        },
      },
      "customers loaded",
    );
  } catch (error) {
    return next(error);
  }
});

customerRouter.get("/:id", authorize("customers.read"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getCustomerScope(req);
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        ...(scope ?? {}),
      },
      include: {
        activatedFromProspect: {
          select: {
            id: true,
            status: true,
            installationDate: true,
          },
        },
        customerAddresses: {
          orderBy: { createdAt: "asc" },
        },
        customerUser: {
          select: {
            id: true,
            username: true,
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            subscriptionNo: true,
            status: true,
            activationDate: true,
            billingAnchorDay: true,
            pppoeUsername: true,
            pppoePassword: req.currentUser?.permissions.includes("subscriptions.view_pppoe_password") ?? false,
            servicePlan: {
              select: {
                id: true,
                code: true,
                name: true,
                priceMonthly: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return sendError(res, 404, "Customer not found");
    }

    return sendOk(res, customer, "customer loaded");
  } catch (error) {
    return next(error);
  }
});

customerRouter.patch("/:id", authorize("customers.update"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getCustomerScope(req);
    const existingCustomer = await db.customer.findFirst({
      where: {
        id: customerId,
        ...(scope ?? {}),
      },
    });

    if (!existingCustomer) {
      return sendError(res, 404, "Customer not found");
    }

    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid customer payload", parsed.error.flatten());
    }

    const customer = await db.customer.update({
      where: { id: existingCustomer.id },
      data: parsed.data,
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "customers",
      action: "update",
      entityType: "customer",
      entityId: customer.id,
      oldValues: existingCustomer,
      newValues: customer,
    });

    return sendOk(res, customer, "customer updated");
  } catch (error) {
    return next(error);
  }
});

customerRouter.delete("/:id", authorize("customers.delete"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getCustomerScope(req);
    const existingCustomer = await db.customer.findFirst({
      where: {
        id: customerId,
        ...(scope ?? {}),
      },
    });

    if (!existingCustomer) {
      return sendError(res, 404, "Customer not found");
    }

    const customer = await db.customer.update({
      where: { id: existingCustomer.id },
      data: {
        status: "terminated",
        deletedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "customers",
      action: "delete",
      entityType: "customer",
      entityId: customer.id,
      oldValues: existingCustomer,
      newValues: customer,
    });

    return sendOk(res, { id: customer.id }, "customer deleted");
  } catch (error) {
    return next(error);
  }
});
