import { expect, type Page, test } from "@playwright/test";

type CommitteeMemberDebug = {
  index: number;
  name: string;
  groupIndex: number;
  hovered: boolean;
  scale: number;
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
  await page.waitForTimeout(600);
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

test("keeps the committee hover animation stable at the icon edge", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Hover is pointer-only");

  await openScene(page);
  const firstCommitteeStop = await findFirstCommitteeStop(page);
  await scrollToStop(page, firstCommitteeStop);
  await expect(page.locator("body")).toHaveAttribute(
    "data-on-committee",
    "true",
  );

  const member = await findClickableMember(page);
  const width = member.bounds.right - member.bounds.left;
  await page.mouse.move(member.bounds.right - width * 0.08, member.center.y);

  await expect
    .poll(async () => {
      const current = (await readVisibleMembers(page)).find(
        (entry) => entry.name === member.name,
      );
      return current?.hovered;
    })
    .toBe(true);

  const scales: number[] = [];
  for (let frame = 0; frame < 20; frame += 1) {
    await page.waitForTimeout(50);
    const current = (await readVisibleMembers(page)).find(
      (entry) => entry.name === member.name,
    );
    expect(current?.hovered, "hover must not flicker").toBe(true);
    scales.push(current?.scale ?? 1);
  }
  expect(Math.max(...scales)).toBeGreaterThan(1.02);

  await page.mouse.move(12, 300);
  await page.waitForTimeout(400);
  const after = (await readVisibleMembers(page)).find(
    (entry) => entry.name === member.name,
  );
  expect(after?.hovered).toBe(false);
  expect(after?.scale ?? 1).toBeLessThan(1.01);
});

test("scales every visible committee icon on hover", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Hover is pointer-only");

  await openScene(page);
  const firstCommitteeStop = await findFirstCommitteeStop(page);
  await scrollToStop(page, firstCommitteeStop);

  const members = await readVisibleMembers(page);
  expect(members.length).toBeGreaterThan(0);

  for (const member of members) {
    const width = member.bounds.right - member.bounds.left;
    await page.mouse.move(member.bounds.left + width * 0.85, member.center.y);

    await expect
      .poll(
        async () => {
          const current = (await readVisibleMembers(page)).find(
            (entry) => entry.name === member.name,
          );
          return current ? current.hovered && current.scale > 1.02 : false;
        },
        { timeout: 10_000 },
      )
      .toBe(true);
  }

  await page.mouse.move(12, 300);
  await expect
    .poll(async () => {
      const current = await readVisibleMembers(page);
      return current.every((entry) => !entry.hovered);
    })
    .toBe(true);
});

test("plays the hover animation while between committee stops", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Hover is pointer-only");

  await openScene(page);
  const firstCommitteeStop = await findFirstCommitteeStop(page);
  await scrollToStop(page, firstCommitteeStop + 0.05);
  await expect(page.locator("body")).toHaveAttribute(
    "data-on-committee",
    "true",
  );

  const member = await findClickableMember(page);
  await page.mouse.move(member.center.x, member.center.y);

  await expect
    .poll(
      async () => {
        const current = (await readVisibleMembers(page)).find(
          (entry) => entry.name === member.name,
        );
        return current ? current.hovered && current.scale > 1 : false;
      },
      { timeout: 10_000 },
    )
    .toBe(true);
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
