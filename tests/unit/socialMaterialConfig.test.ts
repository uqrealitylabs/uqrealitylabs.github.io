import { materialConfigs } from "@uqrealitylabs/feelable-materials";
import { describe, expect, it } from "vitest";
import { getSiteContent } from "../../src/content/contentRegistry";
import { resolveSocialMaterialKind } from "../../src/shared/lib/socialMaterials";

describe("social material configs", () => {
  it.each([
    ["Website", "cloth", "crease"],
    ["Instagram", "cloth", "crease"],
    ["Discord", "rubber", "squish"],
    ["LinkedIn", "glass", "smudge"],
    ["Email", "grass", "bend"],
    ["Mail", "grass", "bend"],
  ] as const)("maps %s to %s material behavior", (label, kind, behavior) => {
    expect(resolveSocialMaterialKind({ label })).toBe(kind);
    expect(materialConfigs[kind]).toMatchObject({
      behavior,
      pointerResponse: true,
    });
  });

  it("exposes each required feelable material through live social content", () => {
    const socialMaterials = getSiteContent("en").socialLinks.map((social) =>
      resolveSocialMaterialKind(social),
    );

    expect(new Set(socialMaterials)).toEqual(
      new Set(["cloth", "rubber", "glass", "grass"]),
    );
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Email" }),
    );
    expect(resolveSocialMaterialKind({ label: "Email" })).toBe("grass");
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Instagram", material: "cloth" }),
    );
    expect(resolveSocialMaterialKind({ label: "unknown network" })).toBe(
      "cloth",
    );
    expect(resolveSocialMaterialKind({})).toBe("cloth");
  });
});
