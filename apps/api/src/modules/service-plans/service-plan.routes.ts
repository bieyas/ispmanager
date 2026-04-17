import { Router } from "express";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { writeAuditLog } from "../../lib/audit.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createServicePlanSchema, updateServicePlanSchema } from "./service-plan.schemas.js";

export const servicePlanRouter = Router();

servicePlanRouter.use(authenticate);

servicePlanRouter.get("/", authorize("service_plans.list"), async (_req, res, next) => {
  try {
    const servicePlans = await db.servicePlan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return sendOk(res, servicePlans, "service plans loaded");
  } catch (error) {
    return next(error);
  }
});

servicePlanRouter.get("/:id", authorize("service_plans.read"), async (req, res, next) => {
  try {
    const servicePlanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const servicePlan = await db.servicePlan.findUnique({
      where: { id: servicePlanId },
    });

    if (!servicePlan) {
      return sendError(res, 404, "Service plan not found");
    }

    return sendOk(res, servicePlan, "service plan loaded");
  } catch (error) {
    return next(error);
  }
});

servicePlanRouter.post("/", authorize("service_plans.create"), async (req, res, next) => {
  try {
    const parsed = createServicePlanSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid service plan payload", parsed.error.flatten());
    }

    const servicePlan = await db.servicePlan.create({
      data: {
        ...parsed.data,
        priceMonthly: parsed.data.priceMonthly,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "service_plans",
      action: "create",
      entityType: "service_plan",
      entityId: servicePlan.id,
      newValues: servicePlan,
    });

    return sendCreated(res, servicePlan, "service plan created");
  } catch (error) {
    return next(error);
  }
});

servicePlanRouter.patch("/:id", authorize("service_plans.update"), async (req, res, next) => {
  try {
    const servicePlanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existingServicePlan = await db.servicePlan.findUnique({
      where: { id: servicePlanId },
    });

    if (!existingServicePlan) {
      return sendError(res, 404, "Service plan not found");
    }

    const parsed = updateServicePlanSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid service plan payload", parsed.error.flatten());
    }

    const servicePlan = await db.servicePlan.update({
      where: { id: servicePlanId },
      data: parsed.data,
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "service_plans",
      action: "update",
      entityType: "service_plan",
      entityId: servicePlan.id,
      oldValues: existingServicePlan,
      newValues: servicePlan,
    });

    return sendOk(res, servicePlan, "service plan updated");
  } catch (error) {
    return next(error);
  }
});

servicePlanRouter.delete("/:id", authorize("service_plans.deactivate"), async (req, res, next) => {
  try {
    const servicePlanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existingServicePlan = await db.servicePlan.findUnique({
      where: { id: servicePlanId },
    });

    if (!existingServicePlan) {
      return sendError(res, 404, "Service plan not found");
    }

    const servicePlan = await db.servicePlan.update({
      where: { id: servicePlanId },
      data: {
        isActive: false,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "service_plans",
      action: "deactivate",
      entityType: "service_plan",
      entityId: servicePlan.id,
      oldValues: existingServicePlan,
      newValues: servicePlan,
    });

    return sendOk(res, servicePlan, "service plan deactivated");
  } catch (error) {
    return next(error);
  }
});
