import { expect, it } from "vitest";
import { sunlight } from "../../src/world/sun";

it("follows UTC rotation and opposite solstices", () => {
  const june = sunlight(new Date("2026-06-21T12:00:00Z"));
  const december = sunlight(new Date("2026-12-21T12:00:00Z"));
  expect(june.latitude).toBeCloseTo(23.44, 0);
  expect(december.latitude).toBeCloseTo(-23.44, 0);
  expect(Math.abs(june.longitude)).toBeLessThan(1);
  const midnight = sunlight(new Date("2026-06-21T00:00:00Z"));
  expect(Math.abs(midnight.longitude)).toBeGreaterThan(179);
  expect(june.direction.length()).toBeCloseTo(1);
});
