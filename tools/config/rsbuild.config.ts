import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  html: {
    template: "./index.html",
  },
  source: {
    entry: { index: "./src/app/main.tsx" },
  },
  output: {
    assetPrefix: "auto",
    distPath: {
      root: "dist",
      js: "bundled",
      css: "bundled",
      media: "bundled",
    },
    sourceMap: {
      js:
        process.env.NODE_ENV === "production"
          ? "hidden-source-map"
          : "cheap-module-source-map",
    },
  },
  tools: {
    rspack(config, { appendPlugins }) {
      if (process.env.RSDOCTOR === "true") {
        appendPlugins(
          new RsdoctorRspackPlugin({
            disableClientServer: true,
            output: {
              mode: "brief",
              reportCodeType: "noCode",
              reportDir: "artifacts/rsdoctor",
            },
          }),
        );
      }
      return config;
    },
  },
});
