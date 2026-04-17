import type { NextFunction, Request, Response } from "express";
import { sendError } from "../lib/http.js";

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.currentUser;

    if (!currentUser) {
      return sendError(res, 401, "Unauthorized");
    }

    const missingPermissions = requiredPermissions.filter(
      (permission) => !currentUser.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      return sendError(res, 403, "Forbidden", {
        missingPermissions,
      });
    }

    return next();
  };
}
