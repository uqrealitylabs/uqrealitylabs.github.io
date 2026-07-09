import {
  getMaterialKind,
  materialConfigs,
} from "@uqrealitylabs/materials-actually";
import { describe, expect, it } from "vitest";
import { getSiteContent } from "../../src/content/contentRegistry";

describe("social material configs", () => {
  it.each([
    ["Instagram", "cloth", "crease"],
    ["Discord", "rubber", "squish"],
    ["LinkedIn", "glass", "smudge"],
    ["Email", "mail", "bend"],
    ["Mail", "mail", "bend"],
    ["grass", "grass", "bend"],
  ] as const)("maps %s to %s material behavior", (label, kind, behavior) => {
    expect(getMaterialKind(label)).toBe(kind);
    expect(materialConfigs[kind]).toMatchObject({
      behavior,
      pointerResponse: true,
    });
  });

  it("exposes each required feelable material through live social content", () => {
    const socialMaterials = getSiteContent("en").socialLinks.map((social) =>
      getMaterialKind(social.material ?? social.label),
    );

    expect(new Set(socialMaterials)).toEqual(
      new Set(["cloth", "rubber", "glass", "grass", "mail"]),
    );
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Email" }),
    );
    expect(getMaterialKind("Email")).toBe("mail");
    expect(getSiteContent("en").socialLinks).toContainEqual(
      expect.objectContaining({ label: "Instagram", material: "grass" }),
    );
  });
});
