import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: "static",
  build: {
    outDir: "dist",
    // Avoid collision with static/Assets on case-insensitive filesystems.
    assetsDir: "bundled",
  },
});
