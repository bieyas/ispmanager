import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticateUser } from "./auth.service.js";
import { loginSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.get("/capabilities", (_req, res) => {
  return sendOk(
    res,
    {
      strategy: "bearer-jwt",
      roles: ["admin", "teknisi", "finance", "customer"],
    },
    "auth capabilities loaded",
  );
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid login payload", parsed.error.flatten());
    }

    const result = await authenticateUser(parsed.data);

    if (!result) {
      return sendError(res, 401, "Invalid username or password");
    }

    return sendOk(res, result, "login success");
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", authenticate, (req, res) => {
  return sendOk(res, req.currentUser, "current user loaded");
});
