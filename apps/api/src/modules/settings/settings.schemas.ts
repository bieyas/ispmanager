import { z } from "zod";

export const generalSettingsSchema = z.object({
  defaultMapCenter: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    zoom: z.coerce.number().int().min(1).max(19),
  }),
});
