import bcrypt from "bcryptjs";
import { Router } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { generateTemporaryPassword } from "../../lib/random.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { disableCustomerAccountSchema } from "./customer-account.schemas.js";

export const customerAccountRouter = Router();

customerAccountRouter.use(authenticate);

customerAccountRouter.get("/", authorize("customer_accounts.list"), async (_req, res, next) => {
  try {
    const accounts = await db.customerUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerId: true,
        username: true,
        isActive: true,
        mustChangePassword: true,
        disabledReason: true,
        lastLoginAt: true,
        customer: {
          select: {
            customerCode: true,
            fullName: true,
            status: true,
          },
        },
      },
    });

    return sendOk(res, accounts, "customer accounts loaded");
  } catch (error) {
    return next(error);
  }
});

customerAccountRouter.get("/:customerId", authorize("customer_accounts.read"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const account = await db.customerUser.findUnique({
      where: { customerId },
      select: {
        id: true,
        customerId: true,
        username: true,
        isActive: true,
        mustChangePassword: true,
        disabledReason: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            customerCode: true,
            fullName: true,
            status: true,
            phone: true,
          },
        },
      },
    });

    if (!account) {
      return sendError(res, 404, "Customer account not found");
    }

    return sendOk(res, account, "customer account loaded");
  } catch (error) {
    return next(error);
  }
});

customerAccountRouter.post(
  "/:customerId/reset-password",
  authorize("customer_accounts.reset_password"),
  async (req, res, next) => {
    try {
      const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
      const existingAccount = await db.customerUser.findUnique({
        where: { customerId },
      });

      if (!existingAccount) {
        return sendError(res, 404, "Customer account not found");
      }

      const temporaryPassword = generateTemporaryPassword(10);
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      const account = await db.customerUser.update({
        where: { customerId },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      await writeAuditLog({
        req,
        userId: req.currentUser?.id,
        module: "customer_accounts",
        action: "reset_password",
        entityType: "customer_user",
        entityId: account.id,
        oldValues: existingAccount,
        newValues: {
          id: account.id,
          customerId: account.customerId,
          username: account.username,
          mustChangePassword: account.mustChangePassword,
        },
      });

      return sendOk(
        res,
        {
          customerId: account.customerId,
          username: account.username,
          temporaryPassword,
        },
        "customer account password reset",
      );
    } catch (error) {
      return next(error);
    }
  },
);

customerAccountRouter.post("/:customerId/disable", authorize("customer_accounts.disable"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const parsed = disableCustomerAccountSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid disable payload", parsed.error.flatten());
    }

    const existingAccount = await db.customerUser.findUnique({
      where: { customerId },
    });

    if (!existingAccount) {
      return sendError(res, 404, "Customer account not found");
    }

    const account = await db.customerUser.update({
      where: { customerId },
      data: {
        isActive: false,
        disabledReason: parsed.data.reason ?? "Disabled by administrator",
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "customer_accounts",
      action: "disable",
      entityType: "customer_user",
      entityId: account.id,
      oldValues: existingAccount,
      newValues: account,
    });

    return sendOk(res, account, "customer account disabled");
  } catch (error) {
    return next(error);
  }
});

customerAccountRouter.post("/:customerId/enable", authorize("customer_accounts.enable"), async (req, res, next) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const existingAccount = await db.customerUser.findUnique({
      where: { customerId },
    });

    if (!existingAccount) {
      return sendError(res, 404, "Customer account not found");
    }

    const account = await db.customerUser.update({
      where: { customerId },
      data: {
        isActive: true,
        disabledReason: null,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "customer_accounts",
      action: "enable",
      entityType: "customer_user",
      entityId: account.id,
      oldValues: existingAccount,
      newValues: account,
    });

    return sendOk(res, account, "customer account enabled");
  } catch (error) {
    return next(error);
  }
});
