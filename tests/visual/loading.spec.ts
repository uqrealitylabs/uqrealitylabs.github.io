import { expect, test } from "@playwright/test";

test("scene progress only advances forward", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __uqrlProgress?: number[] }).__uqrlProgress = [];
    window.addEventListener("uqrl:scene-progress", (event) => {
      const ratio = (event as CustomEvent<number>).detail;
      (window as unknown as { __uqrlProgress: number[] }).__uqrlProgress.push(
        ratio,
      );
    });
  });

  await page.goto("/");
  await expect(page.locator('body[data-scene-ready="true"]')).toBeVisible({
    timeout: 90_000,
  });

  const progress = await page.evaluate(
    () => (window as unknown as { __uqrlProgress: number[] }).__uqrlProgress,
  );

  expect(progress.length).toBeGreaterThan(0);
  expect(progress.at(-1)).toBe(1);

  for (let index = 1; index < progress.length; index += 1) {
    expect(
      progress[index],
      `progress regressed from ${progress[index - 1]} to ${progress[index]}`,
    ).toBeGreaterThan(progress[index - 1]);
  }
});
