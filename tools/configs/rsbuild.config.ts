import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
// Loading @rsdoctor/rspack-plugin costs ~16s even when RSDOCTOR is off, so the
// import is commented out with its plugin block below. Uncomment both when you
// need an analysis report.
// import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

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
    rspack(config) {
      // WSL's /mnt/c filesystem does not reliably deliver inotify events, so
      // Rspack's native watcher misses edits. Poll instead so dev rebuilds and
      // HMR keep up with changes.
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 200,
      };
      // Rsdoctor analysis is disabled by default: merely importing the plugin
      // adds ~16s to every build and dev-server start. To enable it, uncomment
      // this block and the import above, then add `{ appendPlugins }` back to
      // the `rspack(config)` parameter list.
      // if (process.env.RSDOCTOR === "true") {
      //   appendPlugins(
      //     new RsdoctorRspackPlugin({
      //       disableClientServer: true,
      //       output: {
      //         mode: "brief",
      //         reportCodeType: "noCode",
      //         reportDir: "artifacts/rsdoctor",
      //       },
      //     }),
      //   );
      // }
      return config;
    },
  },
});
