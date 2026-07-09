import type {
  Locale,
  PageContent,
  SiteContent,
  SocialImage,
} from "../content/schema/contentSchema.ts";
import {
  buildAlternateLocaleUrls,
  buildLocaleUrl,
  type LocaleAlternate,
  type LocaleDomainMode,
  type LocaleUrlConfig,
} from "../shared/i18n/localeUrls.ts";

type SeoUrlOptions = {
  mode?: LocaleDomainMode;
  baseDomain?: string;
  siteOrigin?: string;
  supportedLocales?: readonly string[];
  defaultLocale?: string;
};

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

function uniqueLocales(site: SiteContent, pages: PageContent[] = []) {
  return [...new Set([site.locale, ...pages.map((page) => page.locale)])];
}

function localeUrlConfig(
  site: SiteContent,
  pages: PageContent[] = [],
  options: SeoUrlOptions = {},
): LocaleUrlConfig {
  return {
    siteOrigin: options.siteOrigin ?? site.seo.siteUrl,
    supportedLocales: options.supportedLocales ?? uniqueLocales(site, pages),
    defaultLocale: options.defaultLocale ?? site.locale,
    mode: options.mode ?? "subdomain",
    ...(options.baseDomain ? { baseDomain: options.baseDomain } : {}),
  };
}

export function canonicalUrl(
  site: SiteContent,
  page: PageContent,
  options?: SeoUrlOptions,
) {
  return buildLocaleUrl(
    page.locale,
    canonicalPath(page),
    localeUrlConfig(site, [page], options),
  );
}

export function assetUrl(
  site: SiteContent,
  asset: string,
  options?: SeoUrlOptions,
) {
  return buildLocaleUrl(site.locale, asset, localeUrlConfig(site, [], options));
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
    alternates: buildHreflangAlternates(site, page, [page]),
    siteName: site.seo.siteName,
    type: "website",
  };
}

export function buildStructuredData(
  site: SiteContent,
  page: PageContent,
  options?: SeoUrlOptions,
) {
  const pageUrl = canonicalUrl(site, page, options);
  const siteRoot = buildLocaleUrl(
    site.locale,
    "/",
    localeUrlConfig(site, [page], options),
  );
  const orgId = `${trimSlash(siteRoot)}/#organization`;
  const siteId = `${trimSlash(siteRoot)}/#website`;

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
      url: siteRoot,
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
  options?: SeoUrlOptions,
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
    `Sitemap: ${buildLocaleUrl(
      site.locale,
      "/sitemap.xml",
      localeUrlConfig(site, [], options),
    )}`,
    "",
  ].join("\n");
}

export function indexablePages(pages: PageContent[]) {
  return pages
    .filter(isIndexable)
    .sort(
      (a, b) =>
        canonicalPath(a).localeCompare(canonicalPath(b)) ||
        a.locale.localeCompare(b.locale),
    );
}

export function buildHreflangAlternates(
  site: SiteContent,
  page: PageContent,
  pages: PageContent[] = [page],
  options?: SeoUrlOptions,
): LocaleAlternate[] {
  if (!isIndexable(page)) return [];

  const relatedPages = pages.filter(
    (candidate) => candidate.id === page.id && isIndexable(candidate),
  );
  const supportedLocales = relatedPages.map((candidate) => candidate.locale);
  const config = localeUrlConfig(site, relatedPages, {
    ...options,
    supportedLocales:
      supportedLocales.length > 0 ? supportedLocales : [page.locale],
  });

  return buildAlternateLocaleUrls(canonicalPath(page), config).filter(
    (alternate) =>
      alternate.hreflang === "x-default" ||
      supportedLocales.includes(alternate.hreflang as Locale),
  );
}

export function buildSitemap(
  site: SiteContent,
  pages: PageContent[],
  options?: SeoUrlOptions,
) {
  const urls = indexablePages(pages).map((page) => {
    const lastmodLine = page.meta.updatedAt
      ? `    <lastmod>${escapeHtml(page.meta.updatedAt)}</lastmod>`
      : "";
    const alternates = buildHreflangAlternates(site, page, pages, options)
      .map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeHtml(
            alternate.hreflang,
          )}" href="${escapeHtml(alternate.href)}" />`,
      )
      .join("\n");

    return [
      "  <url>",
      `    <loc>${escapeHtml(canonicalUrl(site, page, options))}</loc>`,
      ...(alternates ? [alternates] : []),
      ...(lastmodLine ? [lastmodLine] : []),
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
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
    site.seo.defaultDescription,
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

export function renderHeadBlock(
  site: SiteContent,
  page: PageContent,
  pages: PageContent[] = [page],
) {
  const meta = buildPageMetadata(site, page);
  const jsonLd = serializeJsonLd(buildStructuredData(site, page));
  const alternates = buildHreflangAlternates(site, page, pages).map(
    (alternate) =>
      `<link rel="alternate" hreflang="${escapeHtml(
        alternate.hreflang,
      )}" href="${escapeHtml(alternate.href)}" />`,
  );

  return [
    "<!-- uqrl:seo:start -->",
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    ...alternates,
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
  const config = localeUrlConfig(site, publicPages);
  const allowedOrigins = new Set(
    config.supportedLocales.map(
      (locale) => new URL(buildLocaleUrl(locale, "/", config)).origin,
    ),
  );

  if (publicPages.length === 0) issues.push("No indexable pages found.");

  for (const page of publicPages) {
    const url = canonicalUrl(site, page);
    if (!allowedOrigins.has(new URL(url).origin)) {
      issues.push(`Canonical URL outside site origin: ${url}`);
    }
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
  if (
    !buildSitemap(site, pages).includes(
      new URL(buildLocaleUrl(site.locale, "/", config)).origin,
    )
  ) {
    issues.push("sitemap must use the production origin.");
  }

  return issues;
}
