import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { sendError } from "../lib/http.js";
import { getCurrentCustomer } from "../modules/customer-auth/customer-auth.service.js";

export async function authenticateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return sendError(res, 401, "Missing bearer token");
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return sendError(res, 401, "Invalid bearer token");
    }

    const payload = verifyAccessToken(token);

    if (payload.accountType !== "customer") {
      return sendError(res, 401, "Unauthorized");
    }

    const currentCustomer = await getCurrentCustomer(payload.sub);

    if (!currentCustomer) {
      return sendError(res, 401, "Customer account not found or inactive");
    }

    req.auth = payload;
    req.currentCustomer = currentCustomer;

    return next();
  } catch (error) {
    return sendError(res, 401, "Unauthorized", error instanceof Error ? error.message : error);
  }
}
