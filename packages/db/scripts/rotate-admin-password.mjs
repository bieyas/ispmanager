import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/index.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(scriptDir, "..", ".env");

if (!process.env.DATABASE_URL && existsSync(envFilePath)) {
  const contents = readFileSync(envFilePath, "utf8");
  const match = contents.match(/^DATABASE_URL=(.*)$/m);

  if (match) {
    process.env.DATABASE_URL = match[1].trim().replace(/^"/, "").replace(/"$/, "");
  }
}

const prisma = new PrismaClient();
const username = process.argv[2] || "admin";
const nextPassword = process.argv[3];

if (!nextPassword) {
  console.error("Usage: node ./scripts/rotate-admin-password.mjs <username> <new-password>");
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, isActive: true },
  });

  if (!user) {
    console.error(`User "${username}" not found.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true,
    },
  });

  console.log(`Password updated for user "${username}".`);
} catch (error) {
  console.error("Failed to rotate admin password");
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
