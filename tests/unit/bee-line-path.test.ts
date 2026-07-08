import { describe, expect, it } from "vitest";
import {
  clampOrbOffset,
  samplePolyline,
  seededGaussian,
} from "../../src/features/bee-line-orb/beeLinePath";

describe("bee-line orb path helpers", () => {
  it("samples a polyline", () => {
    expect(
      samplePolyline(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        0.5,
      ),
    ).toEqual({ x: 5, y: 0 });
  });

  it("clamps organic orb drift", () => {
    expect(clampOrbOffset(22, 8)).toBe(8);
    expect(clampOrbOffset(-22, 8)).toBe(-8);
  });

  it("keeps gaussian output deterministic", () => {
    expect(seededGaussian(42)).toBe(seededGaussian(42));
  });
});
