import { Router } from "express";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticateCustomer } from "../../middlewares/authenticate-customer.js";
import { changeCustomerPassword, authenticateCustomerUser } from "./customer-auth.service.js";
import { customerChangePasswordSchema, customerLoginSchema } from "./customer-auth.schemas.js";

export const customerAuthRouter = Router();

customerAuthRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = customerLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid customer login payload", parsed.error.flatten());
    }

    const result = await authenticateCustomerUser(parsed.data);

    if (!result) {
      return sendError(res, 401, "Invalid username or password");
    }

    return sendOk(res, result, "customer login success");
  } catch (error) {
    return next(error);
  }
});

customerAuthRouter.get("/me", authenticateCustomer, (req, res) => {
  return sendOk(res, req.currentCustomer, "current customer loaded");
});

customerAuthRouter.post("/change-password", authenticateCustomer, async (req, res, next) => {
  try {
    const parsed = customerChangePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid customer change password payload", parsed.error.flatten());
    }

    try {
      const result = await changeCustomerPassword({
        customerUserId: req.currentCustomer!.id,
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });

      return sendOk(res, result, "customer password changed");
    } catch (error) {
      if (error instanceof Error) {
        return sendError(res, 400, error.message);
      }

      throw error;
    }
  } catch (error) {
    return next(error);
  }
});
