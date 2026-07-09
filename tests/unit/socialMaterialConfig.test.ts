import { describe, expect, it } from "vitest";
import {
  getSocialMaterialKind,
  socialMaterialConfigs,
} from "../../src/features/social-materials/materialConfig";

describe("social material configs", () => {
  it.each([
    ["Instagram", "cloth", "crease"],
    ["Discord", "rubber", "squish"],
    ["LinkedIn", "glass", "smudge"],
    ["Email", "mail", "bend"],
    ["Mail", "mail", "bend"],
  ] as const)("maps %s to %s material behavior", (label, kind, behavior) => {
    expect(getSocialMaterialKind(label)).toBe(kind);
    expect(socialMaterialConfigs[kind]).toMatchObject({
      behavior,
      pointerResponse: true,
    });
  });
});
