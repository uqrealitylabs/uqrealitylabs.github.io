import {
  getSiteContent,
  listPages,
} from "../../src/content/contentRegistry.ts";

export function loadSeoInputs(locale = "en") {
  return {
    site: getSiteContent(locale),
    pages: listPages(locale),
  };
}
