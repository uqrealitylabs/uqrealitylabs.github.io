import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: "static",
  build: {
    outDir: "dist",
    assetsDir: "bundled",
  },
});
