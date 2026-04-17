import { ProspectStatus } from "@ispmanager/db";
import { z } from "zod";

const nullableString = z.string().trim().min(1).optional().nullable();
const prospectSortBySchema = z.enum(["createdAt", "fullName", "city", "installationDate", "status"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const createProspectSchema = z.object({
  fullName: z.string().trim().min(1),
  identityNo: nullableString,
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(1),
  servicePlanId: z.string().uuid(),
  installationDate: z.string().date().optional().nullable(),
  pppoeUsername: nullableString,
  pppoePassword: nullableString,
  addressLine: z.string().trim().min(1),
  village: nullableString,
  district: nullableString,
  city: nullableString,
  province: nullableString,
  postalCode: nullableString,
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  mapPickSource: nullableString,
  inputSource: z.string().trim().min(1).default("manual"),
  notes: nullableString,
});

export const updateProspectSchema = createProspectSchema.partial().extend({
  status: z.nativeEnum(ProspectStatus).optional(),
});

export const updateProspectStatusSchema = z
  .object({
    status: z.nativeEnum(ProspectStatus),
    surveyDate: z.string().date().optional().nullable(),
    installationDate: z.string().date().optional().nullable(),
    onuSerialNumber: nullableString,
    statusReason: nullableString,
  })
  .superRefine((data, context) => {
    if (data.status === ProspectStatus.surveyed && !data.surveyDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal survey wajib diisi untuk status surveyed.",
        path: ["surveyDate"],
      });
    }

    if (data.status === ProspectStatus.installed) {
      if (!data.installationDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal instalasi wajib diisi untuk status installed.",
          path: ["installationDate"],
        });
      }

      if (!data.onuSerialNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SN / Serial Number ONU wajib diisi untuk status installed.",
          path: ["onuSerialNumber"],
        });
      }
    }

    if ((data.status === ProspectStatus.cancelled || data.status === ProspectStatus.rejected) && !data.statusReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alasan wajib diisi untuk status cancelled atau rejected.",
        path: ["statusReason"],
      });
    }
  });

export const activateProspectSchema = z.object({
  activationDate: z.string().date(),
  prorateEnabled: z.boolean().optional().default(false),
  firstDueDateOverride: z.string().date().optional().nullable(),
});

export const listProspectsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ProspectStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: prospectSortBySchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
});

export type CreateProspectInput = z.infer<typeof createProspectSchema>;
export type UpdateProspectInput = z.infer<typeof updateProspectSchema>;
export type UpdateProspectStatusInput = z.infer<typeof updateProspectStatusSchema>;
export type ActivateProspectInput = z.infer<typeof activateProspectSchema>;
export type ListProspectsQueryInput = z.infer<typeof listProspectsQuerySchema>;
