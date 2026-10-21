import { translations } from "./load.ts";
import type { Locale } from "./schema.ts";

const textKeys = [
  "skip",
  "menu",
  "navigation",
  "location",
  "eyebrow",
  "introduction",
  "explore",
  "join",
  "scroll",
  "object",
  "rotate",
  "reset",
  "pause",
  "resume",
  "load",
  "loading",
  "ready",
  "static",
  "chapter",
  "aboutBody",
  "award",
  "joinTitle",
  "joinBody",
  "joinAside",
  "teamLabel",
  "teamBody",
  "profile",
  "close",
  "linkedin",
  "partnerLabel",
  "partnerTitle",
  "partnerBody",
  "partnerAction",
  "contactLabel",
  "contactBody",
  "footer",
  "faq",
  "rights",
] as const;
export type Experience = Record<(typeof textKeys)[number], string> & {
  title: string[];
  about: string[];
  teamTitle: string[];
  contactTitle: string[];
  awards: string[][];
  activities: string[][];
  questions: string[][];
  socialHints: Record<string, string>;
};

export function getCopy(locale: Locale): Experience {
  const raw = translations[locale].experience;
  const path = `public/assets/content/${locale}.toml.experience`;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error(`${path}: expected a table`);
  const value = raw as Record<string, unknown>;
  const requireText = (item: unknown, key: string) => {
    if (typeof item !== "string" || !item.trim() || item.length > 16000)
      throw new Error(
        `${path}.${key}: expected nonempty text under 16,000 characters`,
      );
  };
  for (const key of textKeys) requireText(value[key], key);
  for (const [key, count] of [
    ["title", 2],
    ["about", 2],
    ["teamTitle", 2],
    ["contactTitle", 2],
  ] as const) {
    const lines = value[key];
    if (!Array.isArray(lines) || lines.length !== count)
      throw new Error(`${path}.${key}: expected ${count} lines`);
    lines.forEach((line, index) => {
      requireText(line, `${key}.${index}`);
    });
  }
  for (const [key, count] of [
    ["awards", 3],
    ["activities", 3],
    ["questions", 2],
  ] as const) {
    const rows = value[key];
    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error(`${path}.${key}: expected rows`);
    rows.forEach((row, index) => {
      if (!Array.isArray(row) || row.length !== count)
        throw new Error(`${path}.${key}.${index}: expected ${count} values`);
      row.forEach((item, column) => {
        requireText(item, `${key}.${index}.${column}`);
      });
    });
  }
  const hints = value.socialHints;
  if (!hints || typeof hints !== "object" || Array.isArray(hints))
    throw new Error(`${path}.socialHints: expected a table`);
  for (const key of ["Website", "LinkedIn", "Instagram", "Discord", "Email"])
    requireText((hints as Record<string, unknown>)[key], `socialHints.${key}`);
  return value as Experience;
}

export function getInterface(locale: Locale): Record<string, string> {
  const source = translations[locale].interface as Record<string, unknown>;
  const reference = translations.en.interface;
  if (
    !source ||
    typeof source !== "object" ||
    Array.isArray(source) ||
    !reference ||
    typeof reference !== "object" ||
    Array.isArray(reference)
  )
    throw new Error(`${locale}.interface: expected a table`);
  for (const key of Object.keys(reference))
    if (typeof source[key] !== "string" || !source[key].trim())
      throw new Error(`${locale}.interface.${key}: expected text`);
  return source as Record<string, string>;
}
