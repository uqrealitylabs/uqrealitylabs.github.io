export type LocaleDomainMode = "subdomain" | "path" | "off";

export type LocaleUrlConfig = {
  siteOrigin: string;
  supportedLocales: readonly string[];
  defaultLocale: string;
  mode?: LocaleDomainMode;
  baseDomain?: string;
};

export type LocaleAlternate = {
  hreflang: string;
  href: string;
};

function splitHostPort(hostname: string) {
  if (hostname.startsWith("[") && hostname.includes("]")) {
    const end = hostname.indexOf("]");
    return {
      host: hostname.slice(0, end + 1),
      port: hostname.slice(end + 1),
    };
  }

  const match = /^(.*?)(:\d+)?$/.exec(hostname);
  return { host: match?.[1] ?? hostname, port: match?.[2] ?? "" };
}

function normaliseHost(hostname: string) {
  return splitHostPort(hostname.trim().toLowerCase()).host;
}

function isLocalHostname(hostname: string) {
  const host = normaliseHost(hostname);
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]"
  );
}

function localeSet(supportedLocales: readonly string[]) {
  return new Set(supportedLocales.map((locale) => locale.toLowerCase()));
}

export function getLocaleFromHostname(
  hostname: string,
  supportedLocales: readonly string[],
  defaultLocale: string,
) {
  const firstLabel = normaliseHost(hostname).split(".")[0] ?? "";
  return localeSet(supportedLocales).has(firstLabel)
    ? firstLabel
    : defaultLocale;
}

export function stripLocaleSubdomain(
  hostname: string,
  supportedLocales: readonly string[],
) {
  const { host, port } = splitHostPort(hostname.trim().toLowerCase());
  const labels = host.split(".");

  if (labels.length > 1 && localeSet(supportedLocales).has(labels[0])) {
    return `${labels.slice(1).join(".")}${port}`;
  }

  return `${host}${port}`;
}

export function stripLocalePath(
  route: string,
  supportedLocales: readonly string[],
) {
  const url = new URL(route || "/", "https://example.invalid");
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length > 0 && localeSet(supportedLocales).has(parts[0])) {
    url.pathname = `/${parts.slice(1).join("/")}`;
  }

  const path = url.pathname === "" ? "/" : url.pathname;
  return `${path}${url.search}${url.hash}`;
}

function originFor(config: LocaleUrlConfig) {
  const origin = new URL(config.siteOrigin);
  const host = config.baseDomain
    ? stripLocaleSubdomain(config.baseDomain, config.supportedLocales)
    : stripLocaleSubdomain(origin.hostname, config.supportedLocales);

  if (config.baseDomain && !isLocalHostname(config.baseDomain)) {
    origin.hostname = host;
  }

  return origin;
}

export function buildLocaleUrl(
  locale: string,
  route: string,
  config: LocaleUrlConfig,
) {
  const mode = config.mode ?? "subdomain";
  const origin = originFor(config);
  const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(route);

  if (isAbsolute) return route;

  const cleanRoute = stripLocalePath(route || "/", config.supportedLocales);
  const url = new URL(cleanRoute, origin);

  if (mode === "subdomain" && !isLocalHostname(url.hostname)) {
    url.hostname = `${locale}.${stripLocaleSubdomain(
      config.baseDomain ?? url.hostname,
      config.supportedLocales,
    )}`;
  } else if (mode === "path") {
    const path = stripLocalePath(cleanRoute, config.supportedLocales);
    url.pathname = `/${locale}${path === "/" ? "" : path}`;
  }

  return url.href;
}

export function buildAlternateLocaleUrls(
  route: string,
  config: LocaleUrlConfig,
) {
  const alternates: LocaleAlternate[] = config.supportedLocales.map(
    (locale) => ({
      hreflang: locale,
      href: buildLocaleUrl(locale, route, config),
    }),
  );

  alternates.push({
    hreflang: "x-default",
    href: buildLocaleUrl(config.defaultLocale, route, config),
  });

  return alternates;
}
