import { describe, expect, it } from "vitest";
import {
  constrainPupilOffset,
  getExpressionForJoinState,
  getOrganicWinkDelayMs,
  isWithinHideRadius,
  JOIN_US_BLUSH_DELAY_MS,
  JOIN_US_NAVIGATION_DELAY_MS,
  joinUsStates,
  nextJoinUsState,
  shouldShowJoinBlush,
} from "../src/index";

describe("eyslie", () => {
  it("constrains pupils inside eye bounds", () => {
    const offset = constrainPupilOffset(100, -80, { width: 20, height: 16 });
    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5.6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(3.84);
    expect(constrainPupilOffset(0, 0, { width: 20, height: 16 })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("detects hide radius", () => {
    expect(isWithinHideRadius({ x: 4, y: 3 }, { x: 0, y: 0 }, 5)).toBe(true);
    expect(isWithinHideRadius({ x: 6, y: 0 }, { x: 0, y: 0 }, 5)).toBe(false);
  });

  it("moves through JOIN states", () => {
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
        JOIN_US_BLUSH_DELAY_MS - 1,
      ),
    ).toBe(joinUsStates.rubricsHoverExcited);
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
    expect(
      nextJoinUsState(joinUsStates.rubricsHoverExcited, "pointerAway"),
    ).toBe(joinUsStates.rubricsHoverExcited);
    expect(nextJoinUsState(joinUsStates.recoveringToIdle, "recovered")).toBe(
      joinUsStates.idleCurious,
    );
  });

  it("has deterministic timing and expressions", () => {
    expect(shouldShowJoinBlush(JOIN_US_BLUSH_DELAY_MS - 1)).toBe(false);
    expect(shouldShowJoinBlush(JOIN_US_BLUSH_DELAY_MS)).toBe(true);
    expect(JOIN_US_NAVIGATION_DELAY_MS).toBe(500);
    expect(getOrganicWinkDelayMs(12, 0)).toBe(getOrganicWinkDelayMs(12, 0));
    expect(getOrganicWinkDelayMs(12, 0)).not.toBe(getOrganicWinkDelayMs(12, 1));
    expect(getExpressionForJoinState(joinUsStates.idleCurious)).toBe("idle");
    expect(getExpressionForJoinState(joinUsStates.rubricsHoverBlush)).toBe(
      "happy",
    );
    expect(getExpressionForJoinState(joinUsStates.sadShrivel)).toBe("sad");
  });
});
