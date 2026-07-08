import enAbout from "./pages/en/about.json";
import enCommittee from "./pages/en/committee.json";
import enContact from "./pages/en/contact.json";
import enHome from "./pages/en/home.json";
import enRubrics from "./pages/en/rubrics.json";
import enSponsors from "./pages/en/sponsors.json";
import esAbout from "./pages/es/about.json";
import esCommittee from "./pages/es/committee.json";
import esContact from "./pages/es/contact.json";
import esHome from "./pages/es/home.json";
import esRubrics from "./pages/es/rubrics.json";
import esSponsors from "./pages/es/sponsors.json";
import {
  type Locale,
  locales,
  type PageContent,
  type PageId,
  pageIds,
  type SiteContent,
} from "./schema/contentSchema";
import enSite from "./site/en.json";
import esSite from "./site/es.json";

const defaultLocale = "en" satisfies Locale;

const pages = {
  en: {
    home: enHome,
    about: enAbout,
    contact: enContact,
    sponsors: enSponsors,
    committee: enCommittee,
    rubrics: enRubrics,
  },
  es: {
    home: esHome,
    about: esAbout,
    contact: esContact,
    sponsors: esSponsors,
    committee: esCommittee,
    rubrics: esRubrics,
  },
} as unknown as Record<Locale, Record<PageId, PageContent>>;

const sites = {
  en: enSite,
  es: esSite,
} as unknown as Record<Locale, SiteContent>;

export function resolveLocale(locale: string): Locale {
  return locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

export function getAvailableLocales() {
  return [...locales];
}

export function listPages(locale: string) {
  return [...pageIds]
    .map((pageId) => pages[resolveLocale(locale)][pageId])
    .sort((a, b) => a.nav.order - b.nav.order);
}

export function getPageContent(locale: string, page: PageId | string) {
  const resolved = resolveLocale(locale);
  const byId = pages[resolved][page as PageId];
  if (byId) return byId;

  const byRoute = Object.values(pages[resolved]).find(
    (item) => item.route === page,
  );
  if (byRoute) return byRoute;

  throw new Error(`Unknown content page: ${page}`);
}

export function getSiteContent(locale: string) {
  return sites[resolveLocale(locale)];
}

export function allPageEntries() {
  return locales.flatMap((locale) =>
    pageIds.map((pageId) => ({
      locale,
      pageId,
      path: `src/content/pages/${locale}/${pageId}.json`,
      content: pages[locale][pageId],
    })),
  );
}

export function allSiteEntries() {
  return locales.map((locale) => ({
    locale,
    path: `src/content/site/${locale}.json`,
    content: sites[locale],
  }));
}
