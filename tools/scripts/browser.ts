import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rspack } from "@rsbuild/core";
import { defineConfig } from "cypress";
import { generateSettings, settings } from "./settings.ts";

export default defineConfig({
  ...settings("browser"),
  e2e: {
    ...(settings("browser").e2e as Cypress.EndToEndConfigOptions),
    setupNodeEvents(on) {
      generateSettings();
      on(
        "file:preprocessor",
        (file) =>
          new Promise((accept, reject) => {
            const directory = fileURLToPath(
              new URL("../../out/cypress/bundled/", import.meta.url),
            );
            const output = join(directory, `${basename(file.filePath)}.js`);
            const compiler = rspack({
              ...settings("bundle"),
              entry: file.filePath,
              output: {
                path: directory,
                filename: basename(output),
              },
              module: {
                rules: [
                  {
                    test: /\.tsx?$/,
                    loader: "builtin:swc-loader",
                    options: {
                      jsc: {
                        parser: { syntax: "typescript", tsx: true },
                        target: "es2022",
                      },
                    },
                  },
                ],
              },
            });
            if (!compiler) {
              reject(new Error("Test bundler did not start"));
              return;
            }
            compiler.run((error, stats) => {
              compiler.close((closeError) => {
                if (error || closeError || stats?.hasErrors())
                  reject(
                    error ??
                      closeError ??
                      new Error(stats?.toString({ all: false, errors: true })),
                  );
                else accept(output);
              });
            });
          }),
      );
      on("before:browser:launch", (browser, options) => {
        // Linux CI has no hardware GPU, so keep real WebGL tests on Chromium's software renderer
        if (process.platform === "linux" && browser.family === "chromium")
          options.args.push(
            "--enable-unsafe-swiftshader",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--ignore-gpu-blocklist",
          );
        if (browser.name === "electron") {
          options.preferences.width = 2100;
          options.preferences.height = 1400;
        } else options.args.push("--window-size=2100,1400");
        return options;
      });
    },
  },
});
