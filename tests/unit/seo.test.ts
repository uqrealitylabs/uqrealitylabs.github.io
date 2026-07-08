import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getPageContent,
  getSiteContent,
  listPages,
} from "../../src/content/contentRegistry";
import { validatePageContent } from "../../src/content/schema/contentSchema";
import {
  buildLlms,
  buildPageMetadata,
  buildRobots,
  buildSitemap,
  buildStructuredData,
  canonicalUrl,
  serializeJsonLd,
  validateSeo,
} from "../../src/seo/seo";

const site = getSiteContent("en");
const pages = listPages("en");
const home = getPageContent("en", "home");
const about = getPageContent("en", "about");

describe("SEO signals", () => {
  it("generates production and preview robots policies", () => {
    expect(buildRobots(site)).toContain(
      "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    );
    expect(buildRobots(site)).toContain("Allow: /");
    expect(buildRobots(site)).toContain(
      "Sitemap: https://uqrealitylabs.github.io/sitemap.xml",
    );
    expect(buildRobots(site, "preview")).toBe("User-agent: *\nDisallow: /\n");
  });

  it("generates a deterministic sitemap for real indexable routes only", () => {
    const sitemap = buildSitemap(site, pages);

    expect(sitemap).toContain("<loc>https://uqrealitylabs.github.io/</loc>");
    expect(sitemap).not.toContain("/about");
    expect(sitemap).toBe(readFileSync("public/sitemap.xml", "utf8"));
  });

  it("keeps generated public SEO files in sync", () => {
    expect(readFileSync("public/robots.txt", "utf8")).toBe(buildRobots(site));
    expect(readFileSync("public/llms.txt", "utf8")).toBe(
      buildLlms(site, pages),
    );
  });

  it.each([
    [home, "index,follow"],
    [about, "noindex,follow"],
  ])("builds metadata for %s", (page, robots) => {
    const metadata = buildPageMetadata(site, page);

    expect(metadata.canonical).toBe(canonicalUrl(site, page));
    expect(metadata.robots).toBe(robots);
    expect(metadata.image).toBe(
      "https://uqrealitylabs.github.io/Assets/images/labs_logo.png",
    );
  });

  it("builds truthful structured data and escapes JSON-LD safely", () => {
    const jsonLd = buildStructuredData(site, home);

    expect(jsonLd.map((item) => item["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebPage",
    ]);
    expect(jsonLd[1].inLanguage).toBe(site.locale);
    expect(serializeJsonLd({ text: "</script><img src=x>" })).not.toContain(
      "</script>",
    );
  });

  it("rejects unsafe SEO content", () => {
    const invalid = {
      ...home,
      meta: {
        ...home.meta,
        canonicalPath: "/?utm=bad",
        indexable: "true",
        social: { image: { src: "/Assets/images/labs_logo.png" } },
      },
    };

    const issuePaths = validatePageContent(invalid).map((issue) => issue.path);
    expect(issuePaths).toContain("page.meta.canonicalPath");
    expect(issuePaths).toContain("page.meta.indexable");
    expect(issuePaths).toContain("page.meta.social.image.alt");
  });

  it("detects duplicate indexable canonical URLs", () => {
    const duplicate = { ...home, id: "about" as const };
    expect(validateSeo(site, [home, duplicate])).toContain(
      "Duplicate canonical URL: https://uqrealitylabs.github.io/",
    );
  });
});
