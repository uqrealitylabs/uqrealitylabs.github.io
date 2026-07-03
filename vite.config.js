import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    // Avoid collision with public/Assets on case-insensitive filesystems.
    assetsDir: "bundled",
  },
});
