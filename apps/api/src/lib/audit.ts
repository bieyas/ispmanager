import { Prisma } from "@ispmanager/db";
import type { Request } from "express";
import { db } from "./db.js";

type AuditInput = {
  req?: Request;
  userId?: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
};

function toJsonValue(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item)) as Prisma.InputJsonArray;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).flatMap(([key, item]) => {
      if (item === undefined) {
        return [];
      }

      return [[key, toJsonValue(item)]];
    });

    return Object.fromEntries(entries) as Prisma.InputJsonObject;
  }

  return value as Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditInput) {
  const forwardedFor = input.req?.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : input.req?.ip ?? null;

  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      module: input.module,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValues: toJsonValue(input.oldValues),
      newValues: toJsonValue(input.newValues),
      ipAddress,
      userAgent: input.req?.headers["user-agent"] ?? null,
    },
  });
}
