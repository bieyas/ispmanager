import { Router } from "express";
import { db } from "../../lib/db.js";
import { sendError, sendOk } from "../../lib/http.js";
import { writeAuditLog } from "../../lib/audit.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { generalSettingsSchema } from "./settings.schemas.js";

const GENERAL_SETTINGS_KEY = "general";

const DEFAULT_GENERAL_SETTINGS = {
  defaultMapCenter: {
    latitude: -7.5918921,
    longitude: 112.2676439,
    zoom: 14,
  },
};

function normalizeGeneralSettings(value: unknown) {
  const parsed = generalSettingsSchema.safeParse(value);
  if (!parsed.success) {
    return DEFAULT_GENERAL_SETTINGS;
  }

  return parsed.data;
}

export const settingsRouter = Router();

settingsRouter.use(authenticate);

function canAccessSettings(req: Express.Request, permission: string) {
  return req.currentUser?.role.code === "admin" || req.currentUser?.permissions.includes(permission);
}

settingsRouter.get("/general", (req, res, next) => {
  if (!canAccessSettings(req, "settings.general.read")) {
    return authorize("settings.general.read")(req, res, next);
  }

  return next();
}, async (_req, res, next) => {
  try {
    const setting = await db.appSetting.findUnique({
      where: { key: GENERAL_SETTINGS_KEY },
    });

    return sendOk(res, normalizeGeneralSettings(setting?.value), "general settings loaded");
  } catch (error) {
    return next(error);
  }
});

settingsRouter.patch("/general", (req, res, next) => {
  if (!canAccessSettings(req, "settings.general.update")) {
    return authorize("settings.general.update")(req, res, next);
  }

  return next();
}, async (req, res, next) => {
  try {
    const parsed = generalSettingsSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid general settings payload", parsed.error.flatten());
    }

    const existingSetting = await db.appSetting.findUnique({
      where: { key: GENERAL_SETTINGS_KEY },
    });

    const setting = await db.appSetting.upsert({
      where: { key: GENERAL_SETTINGS_KEY },
      update: { value: parsed.data },
      create: {
        key: GENERAL_SETTINGS_KEY,
        value: parsed.data,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "settings",
      action: existingSetting ? "update" : "create",
      entityType: "app_setting",
      entityId: setting.id,
      oldValues: existingSetting?.value ?? null,
      newValues: setting.value,
    });

    return sendOk(res, normalizeGeneralSettings(setting.value), "general settings updated");
  } catch (error) {
    return next(error);
  }
});
