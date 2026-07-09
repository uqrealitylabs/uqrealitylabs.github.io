import sharedGraphRaw from "./graph/shared.json" with { type: "json" };
import enAbout from "./pages/en/about.json" with { type: "json" };
import enCommittee from "./pages/en/committee.json" with { type: "json" };
import enContact from "./pages/en/contact.json" with { type: "json" };
import enHome from "./pages/en/home.json" with { type: "json" };
import enRubrics from "./pages/en/rubrics.json" with { type: "json" };
import enSponsors from "./pages/en/sponsors.json" with { type: "json" };
import esAbout from "./pages/es/about.json" with { type: "json" };
import esCommittee from "./pages/es/committee.json" with { type: "json" };
import esContact from "./pages/es/contact.json" with { type: "json" };
import esHome from "./pages/es/home.json" with { type: "json" };
import esRubrics from "./pages/es/rubrics.json" with { type: "json" };
import esSponsors from "./pages/es/sponsors.json" with { type: "json" };
import {
  type ContentSection,
  isSafeHref,
  isSafeRoutePath,
  type Locale,
  locales,
  type PageContent,
  type PageId,
  pageIds,
  type RoleContent,
  type SiteContent,
  type SocialImage,
  type ValidationIssue,
} from "./schema/contentSchema.ts";
import enSite from "./site/en.json" with { type: "json" };
import esSite from "./site/es.json" with { type: "json" };

const defaultLocale = "en" satisfies Locale;

type Theme = NonNullable<PageContent["theme"]>;
type PageRoute = {
  route: string;
  navOrder: number;
  theme?: Theme;
  sections?: ContentSection[];
  heroCtaRef?: string;
  linkRefs?: Record<string, string>;
  indexable?: boolean;
  canonicalPath?: string;
};
type CtaEntry = { id?: string; href?: string; ref?: string };
type RoleProfile = Omit<RoleContent, "role" | "slugline" | "members"> & {
  members: (Pick<
    RoleContent["members"][number],
    | "name"
    | "photo"
    | "photoWidth"
    | "photoHeight"
    | "photoFocus"
    | "linkedin"
    | "music"
    | "order"
  > & { role?: string })[];
};
type SharedContentGraph = {
  routes: Record<PageId, PageRoute>;
  ctas: Record<string, CtaEntry>;
  seo: Omit<SiteContent["seo"], "defaultDescription" | "defaultSocialImage"> & {
    defaultSocialImage: Pick<SocialImage, "src">;
  };
  socialLinks: SiteContent["socialLinks"];
  committee: SiteContent["committee"];
  roleProfiles: Record<string, RoleProfile>;
};
type RawPageContent = Omit<
  PageContent,
  "route" | "nav" | "hero" | "links" | "theme" | "sections"
> & {
  nav: Omit<PageContent["nav"], "order"> & { order?: number };
  hero: Omit<PageContent["hero"], "cta"> & {
    cta?: { label: string; href?: string };
  };
  links?: Record<string, string>;
};
type RawSiteContent = Pick<
  SiteContent,
  "$schema" | "locale" | "animationCopy"
> & {
  seo: Pick<SiteContent["seo"], "defaultDescription"> & {
    defaultSocialImage: Pick<SocialImage, "alt">;
  };
  roles: Record<
    string,
    Pick<RoleContent, "role" | "slugline" | "microcopy"> & {
      members?: Pick<RoleContent["members"][number], "shortBio" | "bio">[];
    }
  >;
};

const graph = sharedGraphRaw as SharedContentGraph;

const rawPages = {
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
} as unknown as Record<Locale, Record<PageId, RawPageContent>>;

const rawSites = {
  en: enSite,
  es: esSite,
} as unknown as Record<Locale, RawSiteContent>;

function issue(
  issues: ValidationIssue[],
  path: string,
  expected: string,
  actual: unknown,
) {
  issues.push({
    path,
    expected,
    actual,
    message: `${path} must be ${expected}`,
  });
}

function resolveCtaHref(ref: string, trail: string[] = []): string {
  if (trail.includes(ref)) {
    throw new Error(`Circular CTA reference: ${[...trail, ref].join(" -> ")}`);
  }
  const cta = graph.ctas[ref];
  if (!cta) throw new Error(`Unknown CTA reference: ${ref}`);
  if (cta.href) return cta.href;
  if (cta.ref) return resolveCtaHref(cta.ref, [...trail, ref]);
  throw new Error(`CTA reference has no href: ${ref}`);
}

function resolvePage(locale: Locale, pageId: PageId): PageContent {
  const raw = rawPages[locale][pageId];
  const shared = graph.routes[pageId];
  const ctaRef = shared.heroCtaRef;
  const { cta: rawCta, ...hero } = raw.hero;
  const cta: PageContent["hero"]["cta"] | undefined = rawCta
    ? {
        label: rawCta.label,
        href: rawCta.href ?? resolveCtaHref(ctaRef ?? ""),
      }
    : undefined;
  const linkEntries = Object.entries(shared.linkRefs ?? {}).map(
    ([key, ref]) => [key, resolveCtaHref(ref)],
  );

  return {
    ...raw,
    route: shared.route,
    meta: {
      ...raw.meta,
      ...(shared.indexable !== undefined
        ? { indexable: shared.indexable }
        : {}),
      ...(shared.canonicalPath ? { canonicalPath: shared.canonicalPath } : {}),
    },
    nav: { ...raw.nav, order: raw.nav.order ?? shared.navOrder },
    hero: { ...hero, ...(cta ? { cta } : {}) },
    links:
      linkEntries.length > 0
        ? { ...Object.fromEntries(linkEntries), ...(raw.links ?? {}) }
        : raw.links,
    theme: shared.theme,
    sections: shared.sections ?? [],
  };
}

function resolveSite(locale: Locale): SiteContent {
  const raw = rawSites[locale];
  const roles = Object.fromEntries(
    Object.entries(graph.roleProfiles).map(([slug, profile]) => {
      const overlay = raw.roles[slug];
      return [
        slug,
        {
          ...profile,
          ...overlay,
          members: profile.members.map((member, index) => ({
            ...member,
            ...(overlay?.members?.[index] ?? {}),
            role: member.role ?? overlay?.role,
          })),
        },
      ];
    }),
  ) as SiteContent["roles"];

  return {
    ...raw,
    seo: {
      ...graph.seo,
      defaultDescription: raw.seo.defaultDescription,
      defaultSocialImage: {
        ...graph.seo.defaultSocialImage,
        alt: raw.seo.defaultSocialImage.alt,
      },
    },
    socialLinks: graph.socialLinks,
    committee: graph.committee,
    roles,
  };
}

const pages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    Object.fromEntries(
      pageIds.map((pageId) => [pageId, resolvePage(locale, pageId)]),
    ),
  ]),
) as Record<Locale, Record<PageId, PageContent>>;

const sites = Object.fromEntries(
  locales.map((locale) => [locale, resolveSite(locale)]),
) as Record<Locale, SiteContent>;

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

export function getContentGraph() {
  return graph;
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

export function validateRawPageOverlays(
  input: Record<string, Record<string, Record<string, unknown>>> = rawPages,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const graphOwnedKeys = ["route", "theme", "sections"] as const;

  Object.entries(input).forEach(([locale, pagesById]) => {
    Object.entries(pagesById).forEach(([pageId, raw]) => {
      graphOwnedKeys.forEach((key) => {
        if (key in raw) {
          issue(
            issues,
            `src/content/pages/${locale}/${pageId}.json.${key}`,
            "owned by src/content/graph/shared.json",
            raw[key],
          );
        }
      });
    });
  });

  return issues;
}

export function validateContentGraph(
  input: SharedContentGraph = graph,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const routePaths = new Set<string>();

  for (const pageId of pageIds) {
    const route = input.routes[pageId];
    if (!route) {
      issue(issues, `graph.routes.${pageId}`, "route config", route);
      continue;
    }
    if (!isSafeRoutePath(route.route)) {
      issue(issues, `graph.routes.${pageId}.route`, "safe route", route.route);
    }
    if (routePaths.has(route.route)) {
      issue(
        issues,
        `graph.routes.${pageId}.route`,
        "unique route",
        route.route,
      );
    }
    routePaths.add(route.route);
    if (typeof route.navOrder !== "number") {
      issue(
        issues,
        `graph.routes.${pageId}.navOrder`,
        "number",
        route.navOrder,
      );
    }
    if (route.heroCtaRef && !input.ctas[route.heroCtaRef]) {
      issue(
        issues,
        `graph.routes.${pageId}.heroCtaRef`,
        "known CTA ref",
        route.heroCtaRef,
      );
    }
    for (const [key, ref] of Object.entries(route.linkRefs ?? {})) {
      if (!input.ctas[ref]) {
        issue(
          issues,
          `graph.routes.${pageId}.linkRefs.${key}`,
          "known CTA ref",
          ref,
        );
      }
    }
  }

  const visitCta = (ref: string, trail: string[]) => {
    const cta = input.ctas[ref];
    if (!cta) return issue(issues, `graph.ctas.${ref}`, "CTA", cta);
    if (trail.includes(ref)) {
      return issue(
        issues,
        `graph.ctas.${ref}`,
        "acyclic CTA refs",
        [...trail, ref].join(" -> "),
      );
    }
    if (cta.href && !isSafeHref(cta.href)) {
      issue(issues, `graph.ctas.${ref}.href`, "safe href", cta.href);
    }
    if (cta.ref) visitCta(cta.ref, [...trail, ref]);
  };
  Object.keys(input.ctas).forEach((ref) => {
    visitCta(ref, []);
  });

  const roleIds = new Set(Object.keys(input.roleProfiles));
  for (const role of input.committee.roles) {
    if (!roleIds.has(role)) {
      issue(issues, `graph.committee.roles.${role}`, "known role", role);
    }
  }
  input.committee.rows.flat().forEach((role) => {
    if (!roleIds.has(role)) {
      issue(issues, `graph.committee.rows.${role}`, "known role", role);
    }
  });

  return issues;
}
