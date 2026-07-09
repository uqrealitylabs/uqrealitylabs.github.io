import { describe, expect, it } from "vitest";
import cypressConfig from "../../tools/configs/cypress.config";
import cypressViteConfig from "../../tools/configs/cypress-vite.config";

describe("Cypress config", () => {
  it("disables browser access to Cypress.env", () => {
    expect(cypressConfig.allowCypressEnv).toBe(false);
  });

  it("passes the Cypress component Vite config explicitly", () => {
    expect(cypressConfig.component?.devServer).toMatchObject({
      framework: "react",
      bundler: "vite",
      viteConfig: cypressViteConfig,
    });
  });
});
