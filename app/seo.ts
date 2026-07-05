export interface SeoSiteConfig {
  siteName: string;
  siteUrl: string;
  description: string;
  image: string;
}

export function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

export function buildCanonicalUrl(siteUrl: string, path = "/"): string {
  const normalizedBase = normalizeSiteUrl(siteUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function buildSeoMetadata(config: SeoSiteConfig) {
  const siteUrl = normalizeSiteUrl(config.siteUrl);
  const canonical = buildCanonicalUrl(siteUrl, "/");

  return {
    title: config.siteName,
    description: config.description,
    canonical,
    openGraph: {
      title: config.siteName,
      description: config.description,
      url: canonical,
      image: config.image,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.siteName,
      description: config.description,
      image: config.image,
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.siteName,
      url: canonical,
      description: config.description,
    },
  };
}
