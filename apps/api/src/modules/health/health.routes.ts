import { Router } from "express";
import { db } from "../../lib/db.js";
import { sendOk } from "../../lib/http.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    await db.$queryRaw`SELECT 1`;

    return sendOk(res, { database: "ok", service: "api" }, "healthcheck passed");
  } catch (error) {
    return next(error);
  }
});
