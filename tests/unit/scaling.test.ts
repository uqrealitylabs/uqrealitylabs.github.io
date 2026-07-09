import { describe, expect, it } from "vitest";
import { prefersReducedMotion, siteScale } from "../../src/shared/lib/scale";

describe("site scale tokens", () => {
  it.each([
    [{ width: 320, height: 640, remPx: 16 }, 0.85],
    [{ width: 1440, height: 900, remPx: 16 }, 1],
    [{ width: 2560, height: 1400, remPx: 20 }, 1.35],
  ])("clamps scale for %o", (viewport, expected) => {
    expect(siteScale(viewport)).toBe(expected);
  });

  it("reads reduced motion from a query object", () => {
    expect(prefersReducedMotion({ matches: true } as MediaQueryList)).toBe(
      true,
    );
    expect(prefersReducedMotion({ matches: false } as MediaQueryList)).toBe(
      false,
    );
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});
