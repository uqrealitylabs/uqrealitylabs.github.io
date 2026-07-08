import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatIssues,
  validatePageContent,
  validateSiteContent,
} from "../src/content/schema/contentSchema.ts";

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateContentFiles(root = process.cwd()) {
  const issues = [];
  const pageRoot = join(root, "src/content/pages");
  const siteRoot = join(root, "src/content/site");

  for (const locale of readdirSync(pageRoot)) {
    const localeDir = join(pageRoot, locale);
    for (const file of readdirSync(localeDir).filter((name) =>
      name.endsWith(".json"),
    )) {
      const path = join(localeDir, file);
      issues.push(...validatePageContent(readJson(path), path));
    }
  }

  for (const file of readdirSync(siteRoot).filter((name) =>
    name.endsWith(".json"),
  )) {
    const path = join(siteRoot, file);
    issues.push(...validateSiteContent(readJson(path), path));
  }

  return issues;
}

if (process.argv[1]?.endsWith("validate-content.ts")) {
  const issues = validateContentFiles();
  if (issues.length > 0) {
    console.error(formatIssues(issues));
    process.exit(1);
  }
  console.log("Content JSON is valid.");
}
