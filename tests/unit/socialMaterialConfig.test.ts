import { materialConfigs } from "@uqrealitylabs/materials-actually";
import { describe, expect, it } from "vitest";
import { getSiteContent } from "../../src/content/contentRegistry";
import { resolveSocialMaterialKind } from "../../src/shared/lib/socialMaterials";

describe("social material configs", () => {
  it.each([
    ["Website", "cloth", "crease"],
    ["Instagram", "grass", "bend"],
    ["Discord", "rubber", "squish"],
    ["LinkedIn", "glass", "smudge"],
    ["Email", "mail", "bend"],
    ["Mail", "mail", "bend"],
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
      new Set(["cloth", "rubber", "glass", "grass", "mail"]),
    );
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Email" }),
    );
    expect(resolveSocialMaterialKind({ label: "Email" })).toBe("mail");
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Instagram", material: "grass" }),
    );
    expect(resolveSocialMaterialKind({ label: "unknown network" })).toBe(
      "cloth",
    );
    expect(resolveSocialMaterialKind({})).toBe("cloth");
  });
});
