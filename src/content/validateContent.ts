import { allPageEntries, allSiteEntries } from "./contentRegistry";
import {
  formatIssues,
  validatePageContent,
  validateSiteContent,
} from "./schema/contentSchema";

export function validateAllContent() {
  const pageIssues = allPageEntries().flatMap(({ content, path }) =>
    validatePageContent(content, path),
  );
  const siteIssues = allSiteEntries().flatMap(({ content, path }) =>
    validateSiteContent(content, path),
  );

  return [...pageIssues, ...siteIssues];
}

export function assertValidContent() {
  const issues = validateAllContent();
  if (issues.length > 0) {
    throw new Error(formatIssues(issues));
  }
}
