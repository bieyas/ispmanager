import { PrismaClient } from "@ispmanager/db";

declare global {
  // eslint-disable-next-line no-var
  var __ispmanagerPrisma__: PrismaClient | undefined;
}

export const db =
  globalThis.__ispmanagerPrisma__ ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ispmanagerPrisma__ = db;
}
