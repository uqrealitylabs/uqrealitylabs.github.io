import {
  allPageEntries,
  allSiteEntries,
  validateContentGraph,
} from "./contentRegistry.ts";
import {
  formatIssues,
  validatePageContent,
  validateSiteContent,
} from "./schema/contentSchema.ts";

export function validateAllContent() {
  const graphIssues = validateContentGraph();
  const pageIssues = allPageEntries().flatMap(({ content, path }) =>
    validatePageContent(content, path),
  );
  const siteIssues = allSiteEntries().flatMap(({ content, path }) =>
    validateSiteContent(content, path),
  );

  return [...graphIssues, ...pageIssues, ...siteIssues];
}

export function assertValidContent() {
  const issues = validateAllContent();
  if (issues.length > 0) {
    throw new Error(formatIssues(issues));
  }
}
