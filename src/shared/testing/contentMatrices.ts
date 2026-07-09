import {
  getAvailableLocales,
  getPageContent,
  getSiteContent,
  listPages,
} from "../../content/contentRegistry";
import type { ContentBlock } from "../../content/schema/contentSchema";

export const pageMatrix = getAvailableLocales().flatMap((locale) =>
  listPages(locale).map((page) => ({ locale, page })),
);

export const navMatrix = pageMatrix.map(({ locale, page }) => ({
  locale,
  pageId: page.id,
  label: page.nav.label,
  route: page.route,
}));

export const seoPageMatrix = pageMatrix.map(({ locale, page }) => ({
  locale,
  page,
  site: getSiteContent(locale),
}));

export const blockMatrix = pageMatrix.flatMap(({ locale, page }) => {
  const blocks: ContentBlock[] = [
    ...(page.hero.body ?? []),
    ...page.sections.flatMap((section) =>
      section.type === "richText" ? section.blocks : [],
    ),
  ];
  return blocks.map((block) => ({ locale, pageId: page.id, block }));
});

export function pageById(locale: string, pageId: string) {
  return getPageContent(locale, pageId);
}
