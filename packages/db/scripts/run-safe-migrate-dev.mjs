import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const packageDir = process.cwd();
const envFilePath = resolve(packageDir, ".env");
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!existsSync(envFilePath)) {
    return "";
  }

  const contents = readFileSync(envFilePath, "utf8");
  const match = contents.match(/^DATABASE_URL=(.*)$/m);

  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^"/, "").replace(/"$/, "");
}

function getHostname(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "";
  }
}

const databaseUrl = readDatabaseUrl();
const hostname = getHostname(databaseUrl);
const allowRemote = process.env.PRISMA_MIGRATE_DEV_ALLOW_REMOTE === "1";

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Set it in packages/db/.env or the current environment.");
  process.exit(1);
}

if (!allowRemote && !localHosts.has(hostname)) {
  console.error(`Refusing to run prisma migrate dev against remote host "${hostname}".`);
  console.error("Use a local PostgreSQL DATABASE_URL for development migrations.");
  console.error("If you really need this, rerun with PRISMA_MIGRATE_DEV_ALLOW_REMOTE=1.");
  process.exit(1);
}

const child = spawn(
  "pnpm",
  ["exec", "prisma", "migrate", "dev", "--schema", "./prisma/schema.prisma"],
  {
    cwd: packageDir,
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to run prisma migrate dev");
  console.error(error);
  process.exit(1);
});
