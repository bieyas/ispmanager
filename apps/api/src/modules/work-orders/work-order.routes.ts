import { Router } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { Prisma, WorkOrderStatus } from "@ispmanager/db";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { closeWorkOrderSchema, createWorkOrderSchema, listWorkOrdersQuerySchema, updateWorkOrderSchema, uploadWorkOrderAttachmentSchema } from "./work-order.schemas.js";

export const workOrderRouter = Router();

const uploadsDir = new URL("../../../uploads/work-orders/", import.meta.url);

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateWorkOrderNo() {
  const today = new Date();
  const prefix = formatDateYYYYMMDD(today);
  const sameDayCount = await db.workOrder.count({
    where: {
      createdAt: {
        gte: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
        lt: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)),
      },
    },
  });

  return `WO-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

function getWorkOrderScope(req: Express.Request): Prisma.WorkOrderWhereInput | null {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin") {
    return {};
  }

  return {
    OR: [
      {
        assignedToUserId: currentUser.id,
      },
      {
        prospect: {
          createdByUserId: currentUser.id,
        },
      },
      {
        customer: {
          activatedFromProspect: {
            createdByUserId: currentUser.id,
          },
        },
      },
    ],
  };
}

workOrderRouter.use(authenticate);

workOrderRouter.get("/", authorize("work_orders.list"), async (req, res, next) => {
  try {
    const parsed = listWorkOrdersQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid work order query", parsed.error.flatten());
    }

    const scope = getWorkOrderScope(req);
    const where: Prisma.WorkOrderWhereInput = {
      ...(scope ?? {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.sourceType ? { sourceType: parsed.data.sourceType } : {}),
      ...(parsed.data.assignedToUserId ? { assignedToUserId: parsed.data.assignedToUserId } : {}),
      ...(parsed.data.prospectId ? { prospectId: parsed.data.prospectId } : {}),
      ...(parsed.data.customerId ? { customerId: parsed.data.customerId } : {}),
    };

    const [totalItems, items] = await Promise.all([
      db.workOrder.count({ where }),
      db.workOrder.findMany({
        where,
        skip: (parsed.data.page - 1) * parsed.data.pageSize,
        take: parsed.data.pageSize,
        orderBy: [{ createdAt: "desc" }, { scheduledDate: "asc" }],
        include: {
          prospect: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
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
        },
      }),
    ]);

    return sendOk(res, {
      items,
      meta: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / parsed.data.pageSize)),
      },
    }, "work orders loaded");
  } catch (error) {
    return next(error);
  }
});

workOrderRouter.get("/:id", authorize("work_orders.read"), async (req, res, next) => {
  try {
    const workOrderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getWorkOrderScope(req);
    const workOrder = await db.workOrder.findFirst({
      where: {
        id: workOrderId,
        ...(scope ?? {}),
      },
      include: {
        prospect: true,
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
        installationVerification: true,
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workOrder) {
      return sendError(res, 404, "Work order not found");
    }

    return sendOk(res, workOrder, "work order loaded");
  } catch (error) {
    return next(error);
  }
});

workOrderRouter.post("/", authorize("work_orders.create"), async (req, res, next) => {
  try {
    const parsed = createWorkOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid work order payload", parsed.error.flatten());
    }

    const workOrder = await db.workOrder.create({
      data: {
        workOrderNo: await generateWorkOrderNo(),
        sourceType: parsed.data.sourceType,
        sourceId: parsed.data.sourceId ?? null,
        prospectId: parsed.data.prospectId ?? null,
        customerId: parsed.data.customerId ?? null,
        subscriptionId: parsed.data.subscriptionId ?? null,
        assignedToUserId: parsed.data.assignedToUserId ?? null,
        scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
        notes: parsed.data.notes ?? null,
        status: parsed.data.scheduledDate ? WorkOrderStatus.scheduled : WorkOrderStatus.open,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "work_orders",
      action: "create",
      entityType: "work_order",
      entityId: workOrder.id,
      newValues: workOrder,
    });

    return sendCreated(res, workOrder, "work order created");
  } catch (error) {
    return next(error);
  }
});

workOrderRouter.patch("/:id", authorize("work_orders.update"), async (req, res, next) => {
  try {
    const workOrderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = updateWorkOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid work order payload", parsed.error.flatten());
    }

    const scope = getWorkOrderScope(req);
    const existingWorkOrder = await db.workOrder.findFirst({
      where: {
        id: workOrderId,
        ...(scope ?? {}),
      },
    });

    if (!existingWorkOrder) {
      return sendError(res, 404, "Work order not found");
    }

    const workOrder = await db.workOrder.update({
      where: { id: workOrderId },
      data: {
        assignedToUserId: parsed.data.assignedToUserId ?? undefined,
        scheduledDate:
          parsed.data.scheduledDate === undefined
            ? undefined
            : parsed.data.scheduledDate
              ? new Date(parsed.data.scheduledDate)
              : null,
        visitResult: parsed.data.visitResult ?? undefined,
        installationChecklistJson: parsed.data.installationChecklistJson ?? undefined,
        deviceSerialJson: parsed.data.deviceSerialJson ?? undefined,
        signalMetricsJson: parsed.data.signalMetricsJson ?? undefined,
        status: parsed.data.status ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "work_orders",
      action: "update",
      entityType: "work_order",
      entityId: workOrder.id,
      oldValues: existingWorkOrder,
      newValues: workOrder,
    });

    return sendOk(res, workOrder, "work order updated");
  } catch (error) {
    return next(error);
  }
});

workOrderRouter.post("/:id/close", authorize("work_orders.close"), async (req, res, next) => {
  try {
    const workOrderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = closeWorkOrderSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return sendError(res, 400, "Invalid work order close payload", parsed.error.flatten());
    }

    const scope = getWorkOrderScope(req);
    const existingWorkOrder = await db.workOrder.findFirst({
      where: {
        id: workOrderId,
        ...(scope ?? {}),
      },
    });

    if (!existingWorkOrder) {
      return sendError(res, 404, "Work order not found");
    }

    const workOrder = await db.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: WorkOrderStatus.done,
        visitResult: parsed.data.visitResult ?? existingWorkOrder.visitResult,
        notes: parsed.data.notes ?? existingWorkOrder.notes,
        completedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "work_orders",
      action: "close",
      entityType: "work_order",
      entityId: workOrder.id,
      oldValues: existingWorkOrder,
      newValues: workOrder,
    });

    return sendOk(res, workOrder, "work order closed");
  } catch (error) {
    return next(error);
  }
});

workOrderRouter.post("/:id/attachments", authorize("work_orders.upload_attachment"), async (req, res, next) => {
  try {
    const workOrderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = uploadWorkOrderAttachmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid work order attachment payload", parsed.error.flatten());
    }

    const scope = getWorkOrderScope(req);
    const workOrder = await db.workOrder.findFirst({
      where: {
        id: workOrderId,
        ...(scope ?? {}),
      },
      select: {
        id: true,
      },
    });

    if (!workOrder) {
      return sendError(res, 404, "Work order not found");
    }

    const buffer = Buffer.from(parsed.data.contentBase64, "base64");

    if (buffer.byteLength > 5 * 1024 * 1024) {
      return sendError(res, 400, "Attachment exceeds 5MB limit");
    }

    const safeBaseName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const extension = extname(safeBaseName) || ".bin";
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(new URL(storedName, uploadsDir), buffer);

    const attachment = await db.workOrderAttachment.create({
      data: {
        workOrderId,
        fileUrl: `/uploads/work-orders/${storedName}`,
        fileType: parsed.data.mimeType,
        uploadedByUserId: req.currentUser!.id,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "work_orders",
      action: "upload_attachment",
      entityType: "work_order_attachment",
      entityId: attachment.id,
      newValues: attachment,
    });

    return sendCreated(res, attachment, "work order attachment uploaded");
  } catch (error) {
    return next(error);
  }
});
