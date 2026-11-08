import { expect, type Page, test } from "@playwright/test";

type CommitteeMemberDebug = {
  index: number;
  name: string;
  groupIndex: number;
  center: { x: number; y: number };
  bounds: { left: number; right: number; top: number; bottom: number };
};

async function openScene(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { Cypress?: boolean }).Cypress = true;
  });
  await page.goto("/");
  await expect(page.locator('body[data-scene-ready="true"]')).toBeVisible({
    timeout: 90_000,
  });
}

async function scrollToStop(page: Page, stopIndex: number) {
  await page.evaluate((index) => {
    const track = document.querySelector<HTMLElement>("#scroll-track");
    if (!track) return;
    const stops = Math.round(track.offsetHeight / window.innerHeight);
    const stopHeight = track.offsetHeight / stops;
    window.scrollTo(0, index * stopHeight);
  }, stopIndex);
  await page.waitForTimeout(400);
}

async function findFirstCommitteeStop(page: Page) {
  const stops = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>("#scroll-track");
    return Math.round((track?.offsetHeight ?? 0) / window.innerHeight);
  });

  for (let index = 0; index < stops; index += 1) {
    await scrollToStop(page, index);
    const onCommittee = await page.evaluate(
      () => document.body.dataset.onCommittee === "true",
    );
    if (onCommittee) return index;
  }

  throw new Error("Could not find the committee section");
}

async function readVisibleMembers(page: Page) {
  return page.evaluate(() => {
    const read = (
      window as unknown as {
        __uqrlCommitteeMembers?: () => CommitteeMemberDebug[];
      }
    ).__uqrlCommitteeMembers;
    return read ? read() : [];
  });
}

async function findClickableMember(page: Page) {
  await expect
    .poll(async () => (await readVisibleMembers(page)).length)
    .toBeGreaterThan(0);

  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const members = await readVisibleMembers(page);
  const target = members.find(
    (member) =>
      member.bounds.left > 8 &&
      member.bounds.right < viewport.width - 80 &&
      member.bounds.top > 110 &&
      member.bounds.bottom < viewport.height - 8,
  );

  if (!target) {
    throw new Error("No fully visible committee member found");
  }

  return target;
}

async function clickMember(
  page: Page,
  member: CommitteeMemberDebug,
  isMobile: boolean,
) {
  const { x, y } = member.center;
  if (isMobile) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
}

async function expectProfileOpen(page: Page, member: CommitteeMemberDebug) {
  const popup = page.locator("#member-popup");
  await expect(popup).toBeVisible();
  await expect(page.locator("#member-popup-title")).toHaveText(member.name);
}

test("opens a committee profile when settled on a stop", async ({
  page,
}, testInfo) => {
  await openScene(page);
  const firstCommitteeStop = await findFirstCommitteeStop(page);
  await scrollToStop(page, firstCommitteeStop);
  await expect(page.locator("body")).toHaveAttribute(
    "data-on-committee",
    "true",
  );

  const member = await findClickableMember(page);
  await clickMember(page, member, testInfo.project.name === "mobile");

  await expectProfileOpen(page, member);
});

test("opens a committee profile while between scroll stops", async ({
  page,
}, testInfo) => {
  await openScene(page);
  const firstCommitteeStop = await findFirstCommitteeStop(page);
  await scrollToStop(page, firstCommitteeStop + 0.5);
  await expect(page.locator("body")).toHaveAttribute(
    "data-on-committee",
    "true",
  );

  const member = await findClickableMember(page);
  await clickMember(page, member, testInfo.project.name === "mobile");

  await expectProfileOpen(page, member);
});
