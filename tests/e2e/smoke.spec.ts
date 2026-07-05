import { expect, test } from "@playwright/test";

test.describe("site smoke", () => {
  test("@smoke loads the home page and switches sections", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/UQ Reality Labs/);
    await expect(page.locator("#navbar")).toBeVisible();
    await expect(page.locator("#canvas")).toBeVisible();
    await expect(page.getByRole("button", { name: /committee/i })).toBeVisible();

    await page.getByRole("button", { name: /committee/i }).click();
    await page.waitForFunction(() => document.body.dataset.section === "4");

    await expect(page.getByRole("button", { name: /committee/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.locator(".bee-trail--committee")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(overflow).toBeTruthy();
  });
});
