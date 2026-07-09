import { describe, expect, it } from "vitest";
import {
  computePupilPosition,
  constrainPupilOffset,
  createWinkSchedule,
  Eye,
  EyePair,
  getEyeAriaLabel,
  getExpressionState,
  getOrganicWinkDelayMs,
  isWithinHideRadius,
  useEyeTracking,
  useWink,
} from "../src/index";
import type React from "react";

describe("eyslie", () => {
  it("constrains pupils inside eye bounds", () => {
    const offset = constrainPupilOffset(100, -80, { width: 20, height: 16 });
    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5.6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(3.84);
    expect(constrainPupilOffset(0, 0, { width: 20, height: 16 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(computePupilPosition({ width: 20, height: 16 }, { x: 100, y: 0 }).x)
      .toBeLessThanOrEqual(5.6);
  });

  it("detects hide radius", () => {
    expect(isWithinHideRadius({ x: 4, y: 3 }, { x: 0, y: 0 }, 5)).toBe(true);
    expect(isWithinHideRadius({ x: 6, y: 0 }, { x: 0, y: 0 }, 5)).toBe(false);
  });

  it("has deterministic timing and generic expressions", () => {
    expect(createWinkSchedule(12)(0)).toBe(getOrganicWinkDelayMs(12, 0));
    expect(getOrganicWinkDelayMs(12, 0)).toBe(getOrganicWinkDelayMs(12, 0));
    expect(getOrganicWinkDelayMs(12, 0)).not.toBe(getOrganicWinkDelayMs(12, 1));
    expect(getExpressionState("idle")).toMatchObject({ mode: "idle" });
    expect(getExpressionState("happy")).toMatchObject({ smile: true });
    expect(getExpressionState("sad")).toMatchObject({ tear: true });
    expect(getEyeAriaLabel("JOIN US")).toBe("JOIN US (decorative)");
  });

  it("exposes React-friendly hooks as pure deterministic helpers in tests", () => {
    const tracking = useEyeTracking({
      eyeBounds: { width: 20, height: 16 },
      pointer: { x: 10, y: 0 },
    });
    expect(tracking.hidden).toBe(false);
    expect(tracking.pupil.x).toBeGreaterThan(0);
    expect(
      useEyeTracking({
        eyeBounds: { width: 20, height: 16 },
        pointer: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        hideRadius: 5,
      }).hidden,
    ).toBe(true);
    expect(useWink({ seed: 3, index: 0 })).toBe(getOrganicWinkDelayMs(3, 0));
    expect(useWink({ seed: 3, index: 0, reducedMotion: true })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("creates accessible O and U eye elements", () => {
    const o = Eye({ shape: "o", label: "O", color: "red" }) as React.ReactElement;
    const u = Eye({
      shape: "u",
      label: "U",
      expression: "happy",
    }) as React.ReactElement;
    const pair = EyePair({ label: "JOIN US" }) as React.ReactElement;

    expect(o.props).toMatchObject({ "aria-label": "O (decorative)" });
    expect(u.props).toMatchObject({ "data-expression": "happy" });
    expect(pair.props).toMatchObject({
      role: "img",
      "aria-label": "JOIN US (decorative)",
    });
  });
});
