import { expect, type Page, test } from "@playwright/test";

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type TextEntry = {
  index: number;
  titleBounds: Bounds;
  descriptionBounds: Bounds | null;
};

const VIEWPORTS = [
  { width: 900, height: 900 },
  { width: 1440, height: 480 },
  { width: 844, height: 390 },
  { width: 390, height: 844 },
];

async function openScene(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { Cypress?: boolean }).Cypress = true;
  });
  await page.goto("/");
  await expect(page.locator('body[data-scene-ready="true"]')).toBeVisible({
    timeout: 90_000,
  });
}

async function readCurrentText(page: Page) {
  return page.evaluate(() => {
    const read = (
      window as unknown as {
        __uqrlSectionTextBounds?: () => TextEntry[];
      }
    ).__uqrlSectionTextBounds;
    const section = Number(document.body.dataset.section);
    const entry = read ? read()[section] : null;
    const nav = document.querySelector("#navbar")?.getBoundingClientRect();

    return {
      entry,
      nav: nav
        ? { left: nav.left, right: nav.right, top: nav.top, bottom: nav.bottom }
        : null,
    };
  });
}

test("keeps section text inside the viewport and clear of the nav", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Layout is width/height driven",
  );

  await openScene(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("#scroll-track");
      const stops = Math.round((track?.offsetHeight ?? 0) / window.innerHeight);
      return {
        stops,
        stopHeight: (track?.offsetHeight ?? 0) / Math.max(stops, 1),
      };
    });

    for (let section = 0; section <= 4; section += 1) {
      const stop = section === 4 ? metrics.stops - 3 : section;
      await page.evaluate(
        ({ index, stopHeight }) => {
          window.scrollTo(0, index * stopHeight);
        },
        { index: stop, stopHeight: metrics.stopHeight },
      );
      await page.waitForTimeout(350);

      await expect
        .poll(
          async () => {
            const { entry } = await readCurrentText(page);
            if (!entry) return false;

            return (
              Number.isFinite(entry.titleBounds.left) &&
              (!entry.descriptionBounds ||
                Number.isFinite(entry.descriptionBounds.left))
            );
          },
          {
            timeout: 20_000,
            message: `text did not settle at ${viewport.width}x${viewport.height} section ${section}`,
          },
        )
        .toBe(true);

      const { entry, nav } = await readCurrentText(page);
      if (!entry || !nav) continue;

      for (const bounds of [entry.titleBounds, entry.descriptionBounds]) {
        if (!bounds) continue;

        expect(bounds.left).toBeGreaterThanOrEqual(-1);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(bounds.top).toBeGreaterThanOrEqual(-1);
        expect(bounds.bottom).toBeLessThanOrEqual(viewport.height + 1);

        const overlapsNav =
          bounds.left < nav.right &&
          bounds.right > nav.left &&
          bounds.top < nav.bottom - 1 &&
          bounds.bottom > nav.top;
        expect(overlapsNav, "text must not sit under the nav").toBe(false);
      }
    }
  }
});
