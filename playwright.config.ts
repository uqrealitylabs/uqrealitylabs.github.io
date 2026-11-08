import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  testMatch: "**/*.spec.ts",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
