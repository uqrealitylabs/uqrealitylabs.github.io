import { describe, expect, it } from "vitest";
import {
  constrainPupilOffset,
  getOrganicWinkDelayMs,
  JOIN_US_BLUSH_DELAY_MS,
  JOIN_US_NAVIGATION_DELAY_MS,
  joinUsStates,
  nextJoinUsState,
  shouldShowJoinBlush,
} from "../../src/features/living-join-us/joinUsState";

describe("living JOIN US state", () => {
  it("moves through the requested interaction states", () => {
    expect(nextJoinUsState(joinUsStates.idleCurious, "pointerNear")).toBe(
      joinUsStates.joinNear,
    );
    expect(nextJoinUsState(joinUsStates.joinNear, "pointerAway")).toBe(
      joinUsStates.idleCurious,
    );
    expect(nextJoinUsState(joinUsStates.idleCurious, "rubricsHover")).toBe(
      joinUsStates.rubricsHoverExcited,
    );
    expect(
      nextJoinUsState(
        joinUsStates.rubricsHoverExcited,
        "rubricsHoverElapsed",
        JOIN_US_BLUSH_DELAY_MS,
      ),
    ).toBe(joinUsStates.rubricsHoverBlush);
    expect(
      nextJoinUsState(joinUsStates.rubricsHoverBlush, "rubricsClick"),
    ).toBe(joinUsStates.rubricsClickCelebration);
    expect(
      nextJoinUsState(joinUsStates.rubricsHoverExcited, "rubricsLeave"),
    ).toBe(joinUsStates.sadShrivel);
    expect(nextJoinUsState(joinUsStates.recoveringToIdle, "recovered")).toBe(
      joinUsStates.idleCurious,
    );
  });

  it("uses the 3 second blush delay and 0.5 second navigation delay", () => {
    expect(shouldShowJoinBlush(JOIN_US_BLUSH_DELAY_MS - 1)).toBe(false);
    expect(shouldShowJoinBlush(JOIN_US_BLUSH_DELAY_MS)).toBe(true);
    expect(JOIN_US_NAVIGATION_DELAY_MS).toBe(500);
  });

  it("keeps the O pupil constrained inside the eye", () => {
    const offset = constrainPupilOffset(100, -80, { width: 20, height: 16 });

    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5.6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(3.84);
  });

  it("produces deterministic but non-constant wink delays", () => {
    const first = getOrganicWinkDelayMs(12, 0);
    const again = getOrganicWinkDelayMs(12, 0);
    const next = getOrganicWinkDelayMs(12, 1);

    expect(first).toBe(again);
    expect(first).not.toBe(next);
    expect(first).toBeGreaterThanOrEqual(2600);
    expect(first).toBeLessThanOrEqual(6200);
  });
});
