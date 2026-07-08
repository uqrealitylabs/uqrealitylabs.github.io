import type {
  PageContent,
  SiteContent,
  SocialImage,
} from "../content/schema/contentSchema.ts";

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003C")
    .replaceAll(">", "\\u003E")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function canonicalPath(page: PageContent) {
  return page.meta.canonicalPath ?? page.route;
}

export function canonicalUrl(site: SiteContent, page: PageContent) {
  return new URL(canonicalPath(page), `${trimSlash(site.seo.siteUrl)}/`).href;
}

export function assetUrl(site: SiteContent, asset: string) {
  return new URL(asset, `${trimSlash(site.seo.siteUrl)}/`).href;
}

export function isIndexable(page: PageContent) {
  return page.meta.indexable === true;
}

export function titleFor(site: SiteContent, page: PageContent) {
  return site.seo.defaultTitleTemplate.replace("%s", page.meta.title);
}

function socialImageFor(site: SiteContent, page: PageContent): SocialImage {
  return page.meta.social?.image ?? site.seo.defaultSocialImage;
}

export function buildPageMetadata(site: SiteContent, page: PageContent) {
  const title = page.meta.social?.title ?? titleFor(site, page);
  const description =
    page.meta.social?.description ??
    page.meta.description ??
    site.seo.defaultDescription;
  const image = socialImageFor(site, page);
  const canonical = canonicalUrl(site, page);

  return {
    title,
    description,
    robots: isIndexable(page) ? "index,follow" : "noindex,follow",
    canonical,
    image: assetUrl(site, image.src),
    imageAlt: image.alt,
    siteName: site.seo.siteName,
    type: "website",
  };
}

export function buildStructuredData(site: SiteContent, page: PageContent) {
  const pageUrl = canonicalUrl(site, page);
  const orgId = `${trimSlash(site.seo.siteUrl)}/#organization`;
  const siteId = `${trimSlash(site.seo.siteUrl)}/#website`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": orgId,
      name: site.seo.organization.name,
      url: site.seo.organization.url,
      logo: assetUrl(site, site.seo.organization.logo),
      sameAs: site.seo.organization.sameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": siteId,
      name: site.seo.siteName,
      url: site.seo.siteUrl,
      publisher: { "@id": orgId },
      inLanguage: site.locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.meta.title,
      description: page.meta.description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: page.locale,
    },
  ];
}

export function buildRobots(
  site: SiteContent,
  environment: "production" | "preview" = "production",
) {
  if (environment !== "production") {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  const policy = site.seo.contentPolicy;
  const signal = [
    `search=${policy.search ? "yes" : "no"}`,
    `ai-input=${policy.aiInput ? "yes" : "no"}`,
    `ai-train=${policy.aiTrain ? "yes" : "no"}`,
  ].join(", ");

  return [
    "# robots.txt for UQ Reality Labs",
    "# Content signals are crawler instructions and rights reservations, not access control.",
    `Content-Signal: ${signal}`,
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap.xml", site.seo.siteUrl).href}`,
    "",
  ].join("\n");
}

export function indexablePages(pages: PageContent[]) {
  return pages
    .filter(isIndexable)
    .sort((a, b) => canonicalPath(a).localeCompare(canonicalPath(b)));
}

export function buildSitemap(site: SiteContent, pages: PageContent[]) {
  const urls = indexablePages(pages).map((page) => {
    const lastmod = page.meta.updatedAt
      ? `\n    <lastmod>${escapeHtml(page.meta.updatedAt)}</lastmod>`
      : "";
    return [
      "  <url>",
      `    <loc>${escapeHtml(canonicalUrl(site, page))}</loc>${lastmod}`,
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function buildLlms(site: SiteContent, pages: PageContent[]) {
  const urls = indexablePages(pages).map((page) => canonicalUrl(site, page));

  return [
    "# UQ Reality Labs",
    "",
    "UQ Reality Labs is Australia's first Augmented and Virtual Reality Club.",
    "",
    "Public links:",
    ...urls.map((url) => `- ${url}`),
    "",
    "Policy:",
    "- Public search indexing is allowed.",
    "- Real-time AI search may use snippets and should link back to the site.",
    "- AI training, fine-tuning, dataset building, site cloning, and bulk reuse are not permitted without written permission.",
    "",
  ].join("\n");
}

export function renderHeadBlock(site: SiteContent, page: PageContent) {
  const meta = buildPageMetadata(site, page);
  const jsonLd = serializeJsonLd(buildStructuredData(site, page));

  return [
    "<!-- uqrl:seo:start -->",
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    `<script id="uqrl-jsonld" type="application/ld+json">${jsonLd}</script>`,
    "<!-- uqrl:seo:end -->",
  ].join("\n    ");
}

export function validateSeo(site: SiteContent, pages: PageContent[]) {
  const issues: string[] = [];
  const canonicals = new Set<string>();
  const publicPages = indexablePages(pages);

  if (publicPages.length === 0) issues.push("No indexable pages found.");

  for (const page of publicPages) {
    const url = canonicalUrl(site, page);
    if (canonicals.has(url)) issues.push(`Duplicate canonical URL: ${url}`);
    canonicals.add(url);
    if (!page.meta.title.trim()) issues.push(`${page.id} missing title.`);
    if (!page.meta.description.trim()) {
      issues.push(`${page.id} missing description.`);
    }
  }

  if (!buildRobots(site).includes("ai-train=no")) {
    issues.push("robots.txt must reserve AI training rights.");
  }
  if (!buildSitemap(site, pages).includes(trimSlash(site.seo.siteUrl))) {
    issues.push("sitemap must use the production origin.");
  }

  return issues;
}
