import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  html: {
    template: "./index.html",
  },
  dev: {
    // Lazy compilation fetches chunks through HMR hot-update requests. The dev
    // server's HTML fallback answers those missing .hot-update.js requests with
    // index.html, which the browser then tries to evaluate as JavaScript
    // ("SyntaxError: expected expression, got '<'").
    lazyCompilation: false,
  },
  source: {
    entry: {
      index: "./src/app/main.tsx",
    },
  },
  output: {
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
      // WSL's /mnt/c filesystem does not reliably deliver inotify events, so
      // Rspack's native watcher misses edits. Poll instead so dev rebuilds and
      // HMR keep up with changes.
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 200,
      };
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
