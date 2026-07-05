import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const isCI = !!process.env.CI;
const webServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER
  ? undefined
  : {
      command: "npm run preview -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !isCI,
      timeout: 120000,
    };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
  ...(isCI ? { workers: 2 } : {}),
  ...(webServer ? { webServer } : {}),
});
