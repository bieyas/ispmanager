import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { sendError } from "../lib/http.js";
import { getCurrentUser } from "../modules/auth/auth.service.js";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
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

    if (payload.accountType !== "user") {
      return sendError(res, 401, "Unauthorized");
    }

    const currentUser = await getCurrentUser(payload.sub);

    if (!currentUser) {
      return sendError(res, 401, "User not found or inactive");
    }

    req.auth = payload;
    req.currentUser = currentUser;

    return next();
  } catch (error) {
    return sendError(res, 401, "Unauthorized", error instanceof Error ? error.message : error);
  }
}
