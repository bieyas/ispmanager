import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { db } from "./lib/db.js";

const app = createApp();
const server = createServer(app);

async function bootstrap() {
  await db.$connect();

  server.listen(env.PORT, env.HOST, () => {
    console.log(`API listening on http://${env.HOST}:${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error("Failed to start API");
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await db.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await db.$disconnect();
  process.exit(0);
});
