import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));

loadEnv({
  path: resolve(configDir, ".env"),
});

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    seed: "node --import tsx ./src/seed.ts",
  },
});
