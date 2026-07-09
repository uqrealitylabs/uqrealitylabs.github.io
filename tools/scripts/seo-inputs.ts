import {
  allPageEntries,
  getSiteContent,
} from "../../src/content/contentRegistry.ts";

export function loadSeoInputs(locale = "en") {
  return {
    site: getSiteContent(locale),
    pages: allPageEntries().map((entry) => entry.content),
  };
}
