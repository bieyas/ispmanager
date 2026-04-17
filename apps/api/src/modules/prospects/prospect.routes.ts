import { ProspectStatus } from "@ispmanager/db";
import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import {
  activateProspectSchema,
  createProspectSchema,
  listProspectsQuerySchema,
  updateProspectStatusSchema,
  updateProspectSchema,
} from "./prospect.schemas.js";
import { activateProspect } from "./prospect.service.js";

export const prospectRouter = Router();

function getProspectOrderBy(sortBy: "createdAt" | "fullName" | "city" | "installationDate" | "status", sortOrder: "asc" | "desc") {
  if (sortBy === "fullName") {
    return [{ fullName: sortOrder }, { createdAt: "desc" as const }];
  }

  if (sortBy === "city") {
    return [{ city: sortOrder }, { fullName: "asc" as const }, { createdAt: "desc" as const }];
  }

  if (sortBy === "installationDate") {
    return [{ installationDate: sortOrder }, { createdAt: "desc" as const }];
  }

  if (sortBy === "status") {
    return [{ status: sortOrder }, { createdAt: "desc" as const }];
  }

  return [{ createdAt: sortOrder }, { fullName: "asc" as const }];
}

function getProspectScope(req: Express.Request) {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin" || currentUser.role.code === "finance") {
    return { deletedAt: null };
  }

  return {
    createdByUserId: currentUser.id,
    deletedAt: null,
  };
}

function getStatusPermission(status: ProspectStatus) {
  const permissionMap: Record<ProspectStatus, string | null> = {
    prospect: null,
    surveyed: "prospects.mark_surveyed",
    scheduled_installation: "prospects.mark_scheduled_installation",
    installed: "prospects.mark_installed",
    activated: "prospects.activate",
    cancelled: "prospects.mark_cancelled",
    rejected: "prospects.reject",
  };

  return permissionMap[status];
}

prospectRouter.use(authenticate);

prospectRouter.get("/", authorize("prospects.list"), async (req, res, next) => {
  try {
    const scope = getProspectScope(req);
    const parsedQuery = listProspectsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return sendError(res, 400, "Invalid prospect query", parsedQuery.error.flatten());
    }

    const { q, status, page, pageSize, sortBy, sortOrder } = parsedQuery.data;
    const where = {
      ...(scope ?? {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
              { addressLine: { contains: q, mode: "insensitive" as const } },
              { village: { contains: q, mode: "insensitive" as const } },
              { district: { contains: q, mode: "insensitive" as const } },
              { province: { contains: q, mode: "insensitive" as const } },
              {
                servicePlan: {
                  name: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [totalItems, statusSummary, prospects] = await Promise.all([
      db.prospect.count({
        where,
      }),
      db.prospect.groupBy({
        by: ["status"],
        where,
        _count: {
          _all: true,
        },
      }),
      db.prospect.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: getProspectOrderBy(sortBy, sortOrder),
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
          installationDate: true,
          city: true,
          addressLine: true,
          servicePlanId: true,
          servicePlan: {
            select: {
              id: true,
              name: true,
              priceMonthly: true,
            },
          },
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return sendOk(
      res,
      {
        items: prospects,
        meta: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          q: q ?? "",
          status: status ?? "",
          sortBy,
          sortOrder,
        },
        summary: statusSummary.reduce<Record<string, number>>((accumulator, entry) => {
          accumulator[entry.status] = entry._count._all;
          return accumulator;
        }, {}),
      },
      "prospects loaded",
    );
  } catch (error) {
    return next(error);
  }
});

prospectRouter.get("/:id", authorize("prospects.read"), async (req, res, next) => {
  try {
    const prospectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getProspectScope(req);
    const prospect = await db.prospect.findFirst({
      where: {
        id: prospectId,
        ...(scope ?? {}),
      },
      include: {
        lastStatusUpdatedByUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!prospect) {
      return sendError(res, 404, "Prospect not found");
    }

    return sendOk(res, prospect, "prospect loaded");
  } catch (error) {
    return next(error);
  }
});

prospectRouter.patch("/:id/status", authorize("prospects.update"), async (req, res, next) => {
  try {
    const prospectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getProspectScope(req);
    const existingProspect = await db.prospect.findFirst({
      where: {
        id: prospectId,
        ...(scope ?? {}),
      },
    });

    if (!existingProspect) {
      return sendError(res, 404, "Prospect not found");
    }

    const parsed = updateProspectStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid prospect status payload", parsed.error.flatten());
    }

    if (parsed.data.status !== existingProspect.status) {
      const neededPermission = getStatusPermission(parsed.data.status);

      if (neededPermission && !req.currentUser!.permissions.includes(neededPermission)) {
        return sendError(res, 403, "Forbidden", {
          missingPermissions: [neededPermission],
        });
      }
    }

    const now = new Date();
    const updatedProspect = await db.prospect.update({
      where: { id: existingProspect.id },
      data: {
        status: parsed.data.status,
        surveyDate: parsed.data.surveyDate ? new Date(parsed.data.surveyDate) : existingProspect.surveyDate,
        installationDate: parsed.data.installationDate ? new Date(parsed.data.installationDate) : existingProspect.installationDate,
        onuSerialNumber:
          parsed.data.status === ProspectStatus.installed
            ? parsed.data.onuSerialNumber
            : parsed.data.onuSerialNumber === undefined
              ? existingProspect.onuSerialNumber
              : parsed.data.onuSerialNumber,
        statusReason:
          parsed.data.status === ProspectStatus.cancelled || parsed.data.status === ProspectStatus.rejected ? parsed.data.statusReason : null,
        lastStatusUpdatedByUserId: req.currentUser!.id,
        lastStatusUpdatedAt: now,
      },
      include: {
        lastStatusUpdatedByUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "prospects",
      action: "update_status",
      entityType: "prospect",
      entityId: updatedProspect.id,
      oldValues: {
        status: existingProspect.status,
        surveyDate: existingProspect.surveyDate,
        installationDate: existingProspect.installationDate,
        onuSerialNumber: existingProspect.onuSerialNumber,
        statusReason: existingProspect.statusReason,
        lastStatusUpdatedByUserId: existingProspect.lastStatusUpdatedByUserId,
        lastStatusUpdatedAt: existingProspect.lastStatusUpdatedAt,
      },
      newValues: {
        status: updatedProspect.status,
        surveyDate: updatedProspect.surveyDate,
        installationDate: updatedProspect.installationDate,
        onuSerialNumber: updatedProspect.onuSerialNumber,
        statusReason: updatedProspect.statusReason,
        lastStatusUpdatedByUserId: updatedProspect.lastStatusUpdatedByUserId,
        lastStatusUpdatedAt: updatedProspect.lastStatusUpdatedAt,
      },
    });

    return sendOk(res, updatedProspect, "prospect status updated");
  } catch (error) {
    return next(error);
  }
});

prospectRouter.post("/", authorize("prospects.create"), async (req, res, next) => {
  try {
    const parsed = createProspectSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid prospect payload", parsed.error.flatten());
    }

    const servicePlan = await db.servicePlan.findUnique({
      where: { id: parsed.data.servicePlanId },
      select: { id: true },
    });

    if (!servicePlan) {
      return sendError(res, 400, "Service plan not found");
    }

    const prospect = await db.prospect.create({
      data: {
        ...parsed.data,
        installationDate: parsed.data.installationDate ? new Date(parsed.data.installationDate) : null,
        createdByUserId: req.currentUser!.id,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "prospects",
      action: "create",
      entityType: "prospect",
      entityId: prospect.id,
      newValues: prospect,
    });

    return sendCreated(res, prospect, "prospect created");
  } catch (error) {
    return next(error);
  }
});

prospectRouter.patch("/:id", authorize("prospects.update"), async (req, res, next) => {
  try {
    const prospectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getProspectScope(req);
    const existingProspect = await db.prospect.findFirst({
      where: {
        id: prospectId,
        ...(scope ?? {}),
      },
      include: {
        servicePlan: true,
      },
    });

    if (!existingProspect) {
      return sendError(res, 404, "Prospect not found");
    }

    const parsed = updateProspectSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid prospect update payload", parsed.error.flatten());
    }

    if (parsed.data.servicePlanId) {
      const servicePlan = await db.servicePlan.findUnique({
        where: { id: parsed.data.servicePlanId },
        select: { id: true },
      });

      if (!servicePlan) {
        return sendError(res, 400, "Service plan not found");
      }
    }

    if (parsed.data.status && parsed.data.status !== existingProspect.status) {
      const neededPermission = getStatusPermission(parsed.data.status);

      if (neededPermission && !req.currentUser!.permissions.includes(neededPermission)) {
        return sendError(res, 403, "Forbidden", {
          missingPermissions: [neededPermission],
        });
      }
    }

    const updatedProspect = await db.prospect.update({
      where: { id: existingProspect.id },
      data: {
        ...parsed.data,
        installationDate:
          parsed.data.installationDate === undefined
            ? undefined
            : parsed.data.installationDate
              ? new Date(parsed.data.installationDate)
              : null,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "prospects",
      action: "update",
      entityType: "prospect",
      entityId: updatedProspect.id,
      oldValues: existingProspect,
      newValues: updatedProspect,
    });

    return sendOk(res, updatedProspect, "prospect updated");
  } catch (error) {
    return next(error);
  }
});

prospectRouter.delete("/:id", authorize("prospects.delete"), async (req, res, next) => {
  try {
    const prospectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getProspectScope(req);
    const existingProspect = await db.prospect.findFirst({
      where: {
        id: prospectId,
        ...(scope ?? {}),
      },
      include: {
        servicePlan: true,
      },
    });

    if (!existingProspect) {
      return sendError(res, 404, "Prospect not found");
    }

    const deletedProspect = await db.prospect.update({
      where: { id: existingProspect.id },
      data: {
        deletedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "prospects",
      action: "delete",
      entityType: "prospect",
      entityId: deletedProspect.id,
      oldValues: existingProspect,
      newValues: deletedProspect,
    });

    return sendOk(res, { id: existingProspect.id }, "prospect deleted");
  } catch (error) {
    return next(error);
  }
});

prospectRouter.post(
  "/:id/activate",
  authorize("prospects.activate", "prospects.convert_to_customer"),
  async (req, res, next) => {
    try {
      const prospectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsed = activateProspectSchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(res, 400, "Invalid prospect activation payload", parsed.error.flatten());
      }

      const existingProspect = await db.prospect.findFirst({
        where: {
          id: prospectId,
          deletedAt: null,
        },
        include: {
          servicePlan: true,
          activatedCustomer: true,
        },
      });

      if (!existingProspect) {
        return sendError(res, 404, "Prospect not found");
      }

      try {
        const activationResult = await activateProspect({
          prospectId,
          activatedByUserId: req.currentUser!.id,
          activationDate: parsed.data.activationDate,
          prorateEnabled: parsed.data.prorateEnabled,
          firstDueDateOverride: parsed.data.firstDueDateOverride,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "prospects",
          action: "activate",
          entityType: "prospect",
          entityId: activationResult.prospect.id,
          oldValues: existingProspect,
          newValues: {
            status: "activated",
            customerId: activationResult.customer.id,
            customerCode: activationResult.customer.customerCode,
            subscriptionId: activationResult.subscription.id,
            invoiceId: activationResult.invoice.id,
            customerPortalUsername: activationResult.customerUser.username,
          },
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "customers",
          action: "create_from_prospect_activation",
          entityType: "customer",
          entityId: activationResult.customer.id,
          newValues: activationResult.customer,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "subscriptions",
          action: "create_from_prospect_activation",
          entityType: "subscription",
          entityId: activationResult.subscription.id,
          newValues: activationResult.subscription,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "invoices",
          action: "create_on_activation",
          entityType: "invoice",
          entityId: activationResult.invoice.id,
          newValues: activationResult.invoice,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "customer_accounts",
          action: "provision_on_activation",
          entityType: "customer_user",
          entityId: activationResult.customerUser.id,
          newValues: {
            customerId: activationResult.customer.id,
            username: activationResult.customerUser.username,
            mustChangePassword: true,
          },
        });

        return sendCreated(res, activationResult, "prospect activated");
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Prospect not found") {
            return sendError(res, 404, error.message);
          }

          return sendError(res, 400, error.message);
        }

        throw error;
      }
    } catch (error) {
      return next(error);
    }
  },
);
