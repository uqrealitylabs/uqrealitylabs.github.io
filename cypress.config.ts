import { defineConfig } from "cypress";

export default defineConfig({
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
    },
  },
});
