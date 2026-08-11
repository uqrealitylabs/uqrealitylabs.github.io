import { defineConfig } from "cypress";
import cypressViteConfig from "./cypress-vite.config";

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "tests/e2e/**/*.cy.ts",
    supportFile: false,
  },
  component: {
    indexHtmlFile: "tests/component/component-index.html",
    specPattern: "tests/component/**/*.cy.tsx",
    supportFile: false,
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: cypressViteConfig,
    },
  },
});
