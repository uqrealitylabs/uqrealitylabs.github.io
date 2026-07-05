import { describe, expect, test } from "vitest";
import { buildSeoMetadata } from "../app/seo";
import { getBeeTrailPlacement, getCommitteePopupLayout, getNavbarMode } from "../app/responsive";
import { resolveTexturePath } from "../app/assets";

describe("responsive helpers", () => {
  test("nav mode switches at the right breakpoints", () => {
    expect(getNavbarMode(375)).toBe("mobile");
    expect(getNavbarMode(768)).toBe("compact");
    expect(getNavbarMode(1280)).toBe("desktop");
  });

  test("committee popup stays within a sane size envelope", () => {
    const mobile = getCommitteePopupLayout(390, 844);
    const desktop = getCommitteePopupLayout(1440, 900);

    expect(mobile.maxWidth).toBeLessThanOrEqual(400);
    expect(mobile.imageSize).toBeLessThanOrEqual(112);
    expect(mobile.padding).toBeLessThanOrEqual(20);
    expect(desktop.maxWidth).toBeGreaterThan(mobile.maxWidth);
  });

  test("bee trails keep to safe lanes", () => {
    const placement = getBeeTrailPlacement("committee", 390, 844, {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });

    expect(placement.width).toBeGreaterThan(120);
    expect(placement.width).toBeLessThanOrEqual(252);
    expect(placement.bottom).toBeGreaterThan(0);
  });

  test("asset paths stay rooted to the public base", () => {
    expect(resolveTexturePath("/base/", "/Assets/images/Cyrus.webp")).toBe(
      "/base/Assets/images/Cyrus.webp",
    );
  });

  test("seo metadata is generated consistently", () => {
    const seo = buildSeoMetadata({
      siteName: "UQ Reality Labs",
      siteUrl: "https://uqrealitylabs.github.io/",
      description: "AR, VR, and demo culture.",
      image: "https://uqrealitylabs.github.io/og.png",
    });

    expect(seo.canonical).toBe("https://uqrealitylabs.github.io/");
    expect(seo.openGraph.type).toBe("website");
    expect(seo.twitter.card).toBe("summary_large_image");
    expect(seo.structuredData["@type"]).toBe("WebSite");
  });
});
