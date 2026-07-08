import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type PageContent,
  pageIds,
  type SiteContent,
} from "../src/content/schema/contentSchema.ts";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function loadSeoInputs(locale = "en") {
  return {
    site: readJson<SiteContent>(join("src/content/site", `${locale}.json`)),
    pages: pageIds.map((pageId) =>
      readJson<PageContent>(
        join("src/content/pages", locale, `${pageId}.json`),
      ),
    ),
  };
}
