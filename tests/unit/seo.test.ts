import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getContentGraph,
  getPageContent,
  getSiteContent,
  listPages,
} from "../../src/content/contentRegistry";
import {
  validatePageContent,
  validateSiteContent,
} from "../../src/content/schema/contentSchema";
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
import { seoPageMatrix } from "../../src/shared/testing/contentMatrices";

const site = getSiteContent("en");
const pages = listPages("en");
const home = getPageContent("en", "home");
const about = getPageContent("en", "about");

describe("SEO signals", () => {
  it("generates production and preview robots policies", () => {
    const sitemapUrl = new URL("/sitemap.xml", site.seo.siteUrl).href;

    expect(buildRobots(site)).toContain(
      "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    );
    expect(buildRobots(site)).toContain("Allow: /");
    expect(buildRobots(site)).toContain(`Sitemap: ${sitemapUrl}`);
    expect(buildRobots(site, "preview")).toBe("User-agent: *\nDisallow: /\n");
  });

  it("generates a deterministic sitemap for real indexable routes only", () => {
    const sitemap = buildSitemap(site, pages);
    const indexableUrls = pages
      .filter((page) => page.meta.indexable)
      .map((page) => canonicalUrl(site, page));

    indexableUrls.forEach((url) => {
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    });
    expect(sitemap).not.toContain(canonicalUrl(site, about));
    expect(sitemap).toBe(readFileSync("public/sitemap.xml", "utf8"));
  });

  it("keeps generated public SEO files in sync", () => {
    expect(readFileSync("public/robots.txt", "utf8")).toBe(buildRobots(site));
    expect(readFileSync("public/llms.txt", "utf8")).toBe(
      buildLlms(site, pages),
    );
  });

  it.each([
    [
      "apple touch icon",
      "/apple-touch-icon.png",
      "public/apple-touch-icon.png",
    ],
    ["192 icon", "/icon-192.png", "public/icon-192.png"],
    ["512 icon", "/icon-512.png", "public/icon-512.png"],
    ["mask icon", "/safari-pinned-tab.svg", "public/safari-pinned-tab.svg"],
  ])("keeps %s linked from the document head", (_, href, file) => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain(`href="${href}"`);
    expect(existsSync(file)).toBe(true);
  });

  it.each(seoPageMatrix)(
    "builds metadata for $locale/$page.id",
    ({ site, page }) => {
      const metadata = buildPageMetadata(site, page);

      expect(metadata.canonical).toBe(canonicalUrl(site, page));
      expect(metadata.robots).toBe(
        page.meta.indexable ? "index,follow" : "noindex,follow",
      );
      expect(metadata.image).toBe(
        new URL(site.seo.defaultSocialImage.src, `${site.seo.siteUrl}/`).href,
      );
    },
  );

  it("builds truthful structured data and escapes JSON-LD safely", () => {
    const jsonLd = buildStructuredData(site, home);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@graph"].map((item) => item["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebPage",
    ]);
    expect(jsonLd["@graph"].every((item) => !("@context" in item))).toBe(true);
    expect(jsonLd["@graph"][1].inLanguage).toBe(site.locale);
    expect(serializeJsonLd({ text: "</script><img src=x>" })).not.toContain(
      "</script>",
    );
  });

  it("rejects unsafe SEO content", () => {
    const graph = getContentGraph();
    const invalid = {
      ...home,
      meta: {
        ...home.meta,
        canonicalPath: "/?utm=bad",
        indexable: "true",
        social: { image: { src: graph.seo.defaultSocialImage.src } },
      },
    };

    const issuePaths = validatePageContent(invalid).map((issue) => issue.path);
    expect(issuePaths).toContain("page.meta.canonicalPath");
    expect(issuePaths).toContain("page.meta.indexable");
    expect(issuePaths).toContain("page.meta.social.image.alt");
  });

  it("rejects unknown metadata fields instead of rendering unsafe head paths", () => {
    const pageIssuePaths = validatePageContent({
      ...home,
      meta: { ...home.meta, rawHtml: "<meta name=x content=y>" },
    }).map((issue) => issue.path);
    const siteIssuePaths = validateSiteContent({
      ...site,
      seo: { ...site.seo, searchVerification: { google: "token" } },
    }).map((issue) => issue.path);

    expect(pageIssuePaths).toContain("page.meta.rawHtml");
    expect(siteIssuePaths).toContain("site.seo.searchVerification");
  });

  it("detects duplicate indexable canonical URLs", () => {
    const duplicate = { ...home, id: "about" as const };
    expect(validateSeo(site, [home, duplicate])).toContain(
      `Duplicate canonical URL: ${canonicalUrl(site, home)}`,
    );
  });

  it("rejects indexable canonical URLs outside the site origin", () => {
    const external = {
      ...home,
      route: "https://example.com/offsite",
      meta: { ...home.meta, canonicalPath: undefined },
    };

    expect(validateSeo(site, [external])).toContain(
      "Canonical URL outside site origin: https://example.com/offsite",
    );
  });
});
