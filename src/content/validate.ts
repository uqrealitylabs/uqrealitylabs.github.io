import { getSiteContent } from "./catalog.ts";
import { getCopy, getInterface } from "./copy.ts";
import {
  awards,
  documents,
  events,
  projects,
  sponsors,
  terms,
} from "./records.ts";

export function assertValidContent() {
  for (const locale of ["en", "es"] as const) {
    getSiteContent(locale);
    getCopy(locale);
    getInterface(locale);
  }
  documents("about");
  events();
  projects();
  awards();
  sponsors();
  terms();
}
