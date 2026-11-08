import { expect, type Page, test } from "@playwright/test";

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type CommitteeGroupDebug = {
  index: number;
  year: number;
  kind: "exec" | "general";
  count: number;
};

type CommitteeMemberDebug = {
  index: number;
  name: string;
  groupIndex: number;
  indexInGroup: number;
  rowIndex: number;
  colIndex: number;
  rowLength: number;
  caption: string;
  bounds: Bounds;
  captionBounds: Bounds;
  center: { x: number; y: number };
};

type TextEntry = {
  title: string;
  titleBounds: Bounds;
  descriptionBounds: Bounds | null;
};

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "FHD desktop", width: 1920, height: 1080 },
  { name: "2K desktop", width: 2560, height: 1440 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "16in laptop, half FHD", width: 960, height: 1080 },
  { name: "27in 2K, half screen", width: 1280, height: 1440 },
  {
    name: "27in 2K, half screen with vertical sidebar",
    width: 1080,
    height: 1400,
  },
  { name: "narrow tall window", width: 861, height: 1440 },
  { name: "tablet portrait", width: 820, height: 1180 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "short landscape window", width: 1440, height: 480 },
  { name: "phone portrait", width: 390, height: 844 },
  { name: "phone with horizontal browser bar", width: 390, height: 664 },
  { name: "large phone", width: 412, height: 915 },
  { name: "small phone", width: 360, height: 640 },
  { name: "old small phone", width: 320, height: 568 },
  { name: "phone landscape", width: 844, height: 390 },
];

const COMMITTEE_SECTION_INDEX = 4;

async function openScene(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { Cypress?: boolean }).Cypress = true;
  });
  await page.goto("/");
  await expect(page.locator('body[data-scene-ready="true"]')).toBeVisible({
    timeout: 90_000,
  });
}

async function readCommitteeState(page: Page) {
  return page.evaluate((sectionIndex) => {
    const debugWindow = window as unknown as {
      __uqrlCommitteeGroups?: () => CommitteeGroupDebug[];
      __uqrlCommitteeMembers?: () => CommitteeMemberDebug[];
      __uqrlSectionTextBounds?: () => TextEntry[];
    };
    const track = document.querySelector<HTMLElement>("#scroll-track");
    const nav = document.querySelector("#navbar")?.getBoundingClientRect();

    return {
      groups: debugWindow.__uqrlCommitteeGroups?.() ?? [],
      members: debugWindow.__uqrlCommitteeMembers?.() ?? [],
      text: debugWindow.__uqrlSectionTextBounds?.()[sectionIndex],
      stops: Math.max(
        1,
        Math.round((track?.offsetHeight ?? 0) / window.innerHeight),
      ),
      year: document.body.dataset.committeeYear ?? "",
      nav: nav
        ? { left: nav.left, right: nav.right, top: nav.top, bottom: nav.bottom }
        : null,
      overflowX:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  }, COMMITTEE_SECTION_INDEX);
}

async function scrollToStop(page: Page, stopIndex: number) {
  await page.evaluate((index) => {
    const track = document.querySelector<HTMLElement>("#scroll-track");
    if (!track) return;
    const stops = Math.max(1, Math.round(track.offsetHeight / innerHeight));
    const stopHeight = track.offsetHeight / stops;
    window.scrollTo(0, index * stopHeight);
  }, stopIndex);
}

function overlaps(a: Bounds, b: Bounds, gap = 0) {
  return (
    a.left < b.right - gap &&
    a.right > b.left + gap &&
    a.top < b.bottom - gap &&
    a.bottom > b.top + gap
  );
}

function expectInsideViewport(
  bounds: Bounds,
  viewport: { width: number; height: number },
  label: string,
) {
  expect(bounds.left, `${label} left edge`).toBeGreaterThanOrEqual(-1);
  expect(bounds.right, `${label} right edge`).toBeLessThanOrEqual(
    viewport.width + 1,
  );
  expect(bounds.top, `${label} top edge`).toBeGreaterThanOrEqual(-1);
  expect(bounds.bottom, `${label} bottom edge`).toBeLessThanOrEqual(
    viewport.height + 1,
  );
}

test("keeps committee text and icons clear across viewport sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);
  test.skip(
    testInfo.project.name === "mobile",
    "The matrix covers mobile viewports with a resizable context",
  );

  await openScene(page);
  await page.locator('#nav-links button[data-section="4"]').click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-on-committee",
    "true",
  );

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(700);

    const initial = await readCommitteeState(page);
    expect(initial.groups.length, `${viewport.name} groups`).toBeGreaterThan(0);
    const firstCommitteeStop = initial.stops - initial.groups.length;
    expect(firstCommitteeStop).toBeGreaterThanOrEqual(0);

    for (const group of initial.groups) {
      const label = `${viewport.name} / ${group.year} ${group.kind}`;
      await scrollToStop(page, firstCommitteeStop + group.index);
      await page.waitForTimeout(500);

      await expect
        .poll(
          async () => {
            const state = await readCommitteeState(page);
            return (
              state.members.length === group.count &&
              state.members.every(
                (member) => member.groupIndex === group.index,
              ) &&
              state.text?.title === `${group.year} Committee`
            );
          },
          { timeout: 20_000, message: `${label} did not settle` },
        )
        .toBe(true);

      const state = await readCommitteeState(page);
      const text = state.text;

      expect(state.year, `${label} active year`).toBe(String(group.year));
      expect(
        state.overflowX,
        `${label} horizontal overflow`,
      ).toBeLessThanOrEqual(1);
      expect(text, `${label} title`).toBeTruthy();
      if (!text || !state.nav) continue;

      expect(text.title, `${label} heading`).toBe(`${group.year} Committee`);
      expectInsideViewport(text.titleBounds, viewport, `${label} title`);
      if (text.descriptionBounds) {
        expectInsideViewport(
          text.descriptionBounds,
          viewport,
          `${label} description`,
        );
        expect(
          overlaps(text.titleBounds, text.descriptionBounds),
          `${label} title/description overlap`,
        ).toBe(false);
      }
      expect(
        text.titleBounds.top,
        `${label} title under nav`,
      ).toBeGreaterThanOrEqual(state.nav.bottom - 1);

      const members = state.members;
      expect(members.length, `${label} member count`).toBe(group.count);

      for (const member of members) {
        expectInsideViewport(
          member.bounds,
          viewport,
          `${label} ${member.name}`,
        );
        expectInsideViewport(
          member.captionBounds,
          viewport,
          `${label} ${member.name} caption`,
        );
        expect(
          member.bounds.top,
          `${label} ${member.name} under nav`,
        ).toBeGreaterThanOrEqual(state.nav.bottom - 1);
        expect(
          member.bounds.top,
          `${label} ${member.name} under description`,
        ).toBeGreaterThanOrEqual(
          (text.descriptionBounds?.bottom ?? text.titleBounds.bottom) - 1,
        );
        expect(
          member.captionBounds.top,
          `${label} ${member.name} caption under icon`,
        ).toBeGreaterThanOrEqual(member.bounds.bottom - 1);
        expect(
          overlaps(member.bounds, text.titleBounds),
          `${label} ${member.name} icon/title overlap`,
        ).toBe(false);
        if (text.descriptionBounds) {
          expect(
            overlaps(member.bounds, text.descriptionBounds),
            `${label} ${member.name} icon/description overlap`,
          ).toBe(false);
        }
        expect(
          overlaps(member.bounds, member.captionBounds),
          `${label} ${member.name} icon/caption overlap`,
        ).toBe(false);
      }

      for (let first = 0; first < members.length; first += 1) {
        for (let second = first + 1; second < members.length; second += 1) {
          const a = members[first];
          const b = members[second];

          expect(
            overlaps(a.bounds, b.bounds),
            `${label} ${a.name}/${b.name} icon overlap`,
          ).toBe(false);
          expect(
            overlaps(a.captionBounds, b.captionBounds),
            `${label} ${a.name}/${b.name} caption overlap`,
          ).toBe(false);
          expect(
            overlaps(a.bounds, b.captionBounds),
            `${label} ${a.name}/${b.name} icon/caption overlap`,
          ).toBe(false);
          expect(
            overlaps(a.captionBounds, b.bounds),
            `${label} ${a.name}/${b.name} caption/icon overlap`,
          ).toBe(false);
        }
      }

      const rows = new Map<number, CommitteeMemberDebug[]>();
      for (const member of members) {
        const row = rows.get(member.rowIndex) ?? [];
        row.push(member);
        rows.set(member.rowIndex, row);
      }

      const rowIndexes = [...rows.keys()].sort((a, b) => a - b);
      rowIndexes.forEach((rowIndex, expectedRowIndex) => {
        expect(rowIndex, `${label} row order`).toBe(expectedRowIndex);
        const row = rows.get(rowIndex) ?? [];
        expect(row.length, `${label} row ${rowIndex} size`).toBeLessThanOrEqual(
          3,
        );
        const sorted = [...row].sort((a, b) => a.colIndex - b.colIndex);
        sorted.forEach((member, columnIndex) => {
          expect(
            member.colIndex,
            `${label} row ${rowIndex} fills from the left`,
          ).toBe(columnIndex);
        });
        for (let index = 1; index < sorted.length; index += 1) {
          expect(
            sorted[index - 1].center.x,
            `${label} row ${rowIndex} column order`,
          ).toBeLessThan(sorted[index].center.x);
        }
      });
      for (let index = 1; index < rowIndexes.length; index += 1) {
        const previous = rows.get(rowIndexes[index - 1]) ?? [];
        const current = rows.get(rowIndexes[index]) ?? [];
        expect(
          Math.max(...previous.map((member) => member.center.y)),
          `${label} row ${rowIndexes[index]} below row ${rowIndexes[index - 1]}`,
        ).toBeLessThan(Math.min(...current.map((member) => member.center.y)));
      }
    }
  }
});
