import { defineConfig } from "cypress";
import cypressViteConfig from "./cypress-vite.config";

const e2eBaseUrl = process.env.CYPRESS_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  allowCypressEnv: false,
  downloadsFolder: "test-results/cypress/downloads",
  screenshotsFolder: "test-results/cypress/screenshots",
  videosFolder: "test-results/cypress/videos",
  e2e: {
    baseUrl: e2eBaseUrl,
    specPattern: "tests/cypress/e2e/**/*.cy.ts",
    supportFile: "tests/cypress/support/e2e.ts",
    fixturesFolder: "tests/cypress/fixtures",
  },
  component: {
    specPattern: "tests/cypress/component/**/*.cy.tsx",
    supportFile: "tests/cypress/support/component.ts",
    indexHtmlFile: "tests/cypress/support/component-index.html",
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: cypressViteConfig,
    },
  },
});
