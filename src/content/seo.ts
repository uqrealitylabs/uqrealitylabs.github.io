import { getSiteContent } from "./catalog.ts";
import { escapeHtml as e } from "./html.ts";
import type { Page } from "./pages.tsx";

export const origin = "https://uqrealitylabs.com";
export const projectOrigin = "https://project.uqrealitylabs.com";
export function canonicalUrl(page: Page, target = "website") {
  return new URL(
    page.canonicalPath ?? page.path,
    target === "projects" ? projectOrigin : origin,
  ).href;
}
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
export function renderHeadBlock(page: Page, pages: Page[], target = "website") {
  const site = getSiteContent(page.locale);
  const canonical = canonicalUrl(page, target);
  const title =
    page.key === "home" ? page.title : `${page.title} | UQ Reality Labs`;
  const alternates = pages.filter(
    (item) => item.key === page.key && item.indexable,
  );
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: "UQ Reality Labs",
      url: origin,
      logo: `${origin}/assets/brand/touch.png`,
      sameAs: site.socialLinks
        .filter((link) => link.url.startsWith("https:"))
        .map((link) => link.url),
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: origin,
      name: "UQ Reality Labs",
      publisher: { "@id": `${origin}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${canonical}#page`,
      url: canonical,
      name: page.title,
      description: page.description,
      inLanguage: page.locale,
      isPartOf: { "@id": `${origin}/#website` },
    },
  ];
  if (page.path !== "/" && page.key !== "404")
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "UQ Reality Labs",
          item: `${origin}/`,
        },
        { "@type": "ListItem", position: 2, name: page.title, item: canonical },
      ],
    });
  if (page.event?.address) {
    const event = page.event;
    graph.push({
      "@type": "Event",
      name: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      url: canonical,
      eventStatus: `https://schema.org/${event.cancelled ? "EventCancelled" : "EventScheduled"}`,
      location: {
        "@type": "Place",
        name: event.location,
        address: { "@type": "PostalAddress", streetAddress: event.address },
      },
      organizer: { "@id": `${origin}/#organization` },
      ...(event.image ? { image: `${origin}${event.image}` } : {}),
    });
  }
  return [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(page.description)}">`,
    `<meta name="robots" content="${page.indexable ? "index,follow,max-image-preview:large" : "noindex,follow"}">`,
    `<link rel="canonical" href="${e(canonical)}">`,
    ...(alternates.length > 1
      ? [
          ...alternates.map(
            (item) =>
              `<link rel="alternate" hreflang="${item.locale}" href="${e(canonicalUrl(item, target))}">`,
          ),
          `<link rel="alternate" hreflang="x-default" href="${e(canonicalUrl(alternates.find((item) => item.locale === "en") ?? page, target))}">`,
        ]
      : []),
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="UQ Reality Labs">',
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(page.description)}">`,
    `<meta property="og:url" content="${e(canonical)}">`,
    `<meta property="og:locale" content="${page.locale === "en" ? "en_AU" : "es_ES"}">`,
    `<meta property="og:image" content="${origin}/assets/brand/share.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="UQ Reality Labs — augmented and virtual reality at UQ">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${serializeJsonLd({ "@context": "https://schema.org", "@graph": graph })}</script>`,
  ].join("\n");
}
export function buildSitemap(pages: Page[], target = "website") {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter((page) => page.indexable)
    .map((page) => `  <url><loc>${e(canonicalUrl(page, target))}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}
export function buildRobots(target = "website") {
  return `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: Google-Extended\nDisallow: /\n\nSitemap: ${target === "projects" ? projectOrigin : origin}/sitemap.xml\n`;
}
export function buildLlms(pages: Page[], target = "website") {
  return `# UQ Reality Labs\n\nThe University of Queensland augmented and virtual reality club in Brisbane, Australia\n\n## Public pages\n\n${pages
    .filter((page) => page.indexable && page.locale === "en")
    .map(
      (page) =>
        `- [${page.title}](${canonicalUrl(page, target)}): ${page.description}`,
    )
    .join(
      "\n",
    )}\n\n## Authority\n\nConstitution source: https://github.com/uqrealitylabs/constitution/tree/main\nDraft documents are clearly labelled and are not approved policy\nCommittee minutes and member records are private and are not indexed\n\n## Content policy\n\nSearch and real-time AI search may quote public content with attribution and a link\nAI training, bulk reuse and site cloning require written permission\n`;
}
