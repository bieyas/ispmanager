import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "dist");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3001);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function safePathname(urlPathname) {
  const normalized = normalize(urlPathname === "/" ? "/index.html" : urlPathname).replace(/^(\.\.[/\\])+/, "");
  return join(publicDir, normalized);
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
  const filePath = safePathname(pathname);

  try {
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      res.writeHead(302, { Location: "/" });
      res.end();
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    const fallbackPath = join(publicDir, "index.html");

    if (!existsSync(fallbackPath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    createReadStream(fallbackPath).pipe(res);
  }
});

server.listen(port, host, () => {
  console.log(`Admin web listening on http://${host}:${port}`);
});
