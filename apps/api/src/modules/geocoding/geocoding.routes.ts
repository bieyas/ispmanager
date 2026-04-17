import { Router } from "express";
import { z } from "zod";
import { sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";

const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const geocodingRouter = Router();

geocodingRouter.use(authenticate);

geocodingRouter.get("/reverse", async (req, res, next) => {
  try {
    const parsed = reverseGeocodeQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid reverse geocode query", parsed.error.flatten());
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(parsed.data.lat)}&lon=${encodeURIComponent(parsed.data.lng)}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "id,en",
          "User-Agent": "ISPManager/0.1.0 (admin-web reverse geocoding)",
        },
      },
    );

    if (!response.ok) {
      return sendOk(
        res,
        {
          displayName: "",
          address: {},
        },
        "reverse geocoding unavailable",
      );
    }

    const body = (await response.json()) as { error?: string; address?: Record<string, string>; display_name?: string };

    if (body.error) {
      return sendOk(
        res,
        {
          displayName: "",
          address: {},
        },
        "reverse geocoding unavailable",
      );
    }

    return sendOk(
      res,
      {
        displayName: body.display_name || "",
        address: body.address || {},
      },
      "reverse geocoding loaded",
    );
  } catch (error) {
    return next(error);
  }
});
