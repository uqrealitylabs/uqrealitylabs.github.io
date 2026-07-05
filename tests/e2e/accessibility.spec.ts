import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .exclude("canvas")
    .exclude("#chalk-layer")
    .analyze();

  expect(results.violations).toEqual([]);
}

test.describe("accessibility", () => {
  test("@a11y home and committee sections stay clean", async ({ page }) => {
    await page.goto("/");
    await expectNoCriticalViolations(page);

    await page.getByRole("button", { name: /committee/i }).click();
    await page.waitForFunction(() => document.body.dataset.section === "4");
    await expectNoCriticalViolations(page);
  });
});
