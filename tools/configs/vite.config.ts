import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [react(), tailwindcss()],
  publicDir: "public",
  build: {
    outDir: "dist",
    // Avoid collision with public/Assets on case-insensitive filesystems.
    assetsDir: "bundled",
    sourcemap: "hidden",
    // The lazy three.js scene is legitimately large; collect-benchmarks.ts
    // enforces its gzip budget, so skip Vite's raw-size warning.
    chunkSizeWarningLimit: 900,
  },
  server: {
    // Keep the port the Cypress config's baseUrl expects.
    port: 3000,
    // WSL's /mnt/c filesystem does not reliably deliver inotify events, so
    // poll instead of relying on the native watcher.
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
