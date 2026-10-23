import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { trafficFeed } from "./traffic.ts";

const root = resolve("dist");
const traffic = trafficFeed();
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
  ".ics": "text/calendar; charset=utf-8",
  ".xml": "application/xml",
  ".toml": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};
const server = createServer((request, response) => {
  void traffic(request, response, () => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      try {
        if (statSync(file).isDirectory()) file = resolve(file, "index.html");
      } catch {
        file = resolve(root, "404.html");
        response.statusCode = 404;
      }
      const extension = extname(file);
      const accepted = new Map(
        (request.headers["accept-encoding"] ?? "").split(",").map((part) => {
          const [name, ...options] = part.trim().split(";");
          const quality = options.find((option) =>
            option.trim().startsWith("q="),
          );
          return [name, quality ? Number(quality.trim().slice(2)) : 1];
        }),
      );
      const quality = (name: string) =>
        accepted.get(name) ?? accepted.get("*") ?? 0;
      for (const encoding of ["br", "gzip"].sort(
        (a, b) => quality(b) - quality(a),
      )) {
        if (!(quality(encoding) > 0)) continue;
        const path = `${file}.${encoding === "gzip" ? "gz" : "br"}`;
        try {
          if (statSync(path).isFile()) {
            file = path;
            response.setHeader("Content-Encoding", encoding);
            break;
          }
        } catch {
          /* The uncompressed asset remains valid when no smaller encoding was generated */
        }
      }
      const stats = statSync(file);
      const tag = `W/"${stats.size}-${stats.mtimeMs}"`;
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      response.setHeader(
        "Content-Type",
        mime[extension] ?? "application/octet-stream",
      );
      response.setHeader("Vary", "Accept-Encoding");
      response.setHeader("Content-Length", stats.size);
      response.setHeader(
        "Cache-Control",
        pathname.startsWith("/bundled/")
          ? "public, max-age=31536000, immutable"
          : pathname.startsWith("/assets/") &&
              !pathname.startsWith("/assets/content/")
            ? "public, max-age=86400"
            : "public, max-age=0, must-revalidate",
      );
      response.setHeader("ETag", tag);
      if (request.headers["if-none-match"] === tag) {
        response.writeHead(304);
        response.end();
        return;
      }
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      createReadStream(file)
        .on("error", () => response.destroy())
        .pipe(response);
    } catch {
      response.writeHead(400);
      response.end("Invalid request");
    }
  }).catch(() => {
    if (!response.headersSent) response.writeHead(503);
    response.end("Feed unavailable");
  });
});
server.listen(Number(process.env.PORT ?? 4173), "127.0.0.1", () =>
  console.log(
    `UQRL static site and traffic adapter at http://127.0.0.1:${process.env.PORT ?? 4173}`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    traffic.dispose();
    server.close();
  });
