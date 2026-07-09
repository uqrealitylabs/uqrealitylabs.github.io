import { fileURLToPath } from "node:url";
import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "tests/e2e/**/*.cy.ts",
    supportFile: false,
  },
  component: {
    specPattern: "tests/component/**/*.cy.tsx",
    supportFile: false,
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: {
        configFile: false,
        publicDir: fileURLToPath(new URL("./public", import.meta.url)),
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
          },
        },
        esbuild: {
          jsx: "automatic",
        },
        define: {
          "process.env.NODE_ENV": JSON.stringify("test"),
        },
      },
    },
  },
});
