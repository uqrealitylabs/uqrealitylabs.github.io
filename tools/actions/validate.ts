import { readFileSync } from "node:fs";
import {
  getSiteContent,
  listPages,
} from "../../src/content/contentRegistry.ts";
import { formatIssues } from "../../src/content/schema/contentSchema.ts";
import { validateAllContent } from "../../src/content/validateContent.ts";
import {
  buildLlms,
  buildRobots,
  buildSitemap,
  renderHeadBlock,
  validateSeo,
} from "../../src/seo/seo.ts";
import { generateCodename, parseVersion } from "./generate.ts";

type Part = "content" | "seo" | "release";

function validateContent() {
  const issues = validateAllContent();
  if (issues.length > 0) throw new Error(formatIssues(issues));
}

function validateSeoOutput() {
  const site = getSiteContent("en");
  const pages = listPages("en");
  const issues = validateSeo(site, pages);
  const expected = new Map([
    ["public/robots.txt", buildRobots(site)],
    ["public/sitemap.xml", buildSitemap(site, pages)],
    ["public/llms.txt", buildLlms(site, pages)],
  ]);

  for (const [path, value] of expected) {
    if (readFileSync(path, "utf8") !== value) {
      issues.push(`${path} is stale; run npm run generate -- seo`);
    }
  }
  if (
    !readFileSync("index.html", "utf8").includes(
      renderHeadBlock(site, pages[0]),
    )
  ) {
    issues.push("index.html SEO is stale; run npm run generate -- seo");
  }
  if (issues.length > 0) throw new Error(issues.join("\n"));
}

function validateRelease() {
  const issues: string[] = [];
  const first = generateCodename("1.2.3");
  const again = generateCodename("v1.2.3");
  if (first.label !== again.label) issues.push("codename is not deterministic");
  for (const version of [
    "not-a-version",
    "1.2.3-alpha..1",
    "1.2.3-01",
    "1.2.3+meta..x",
  ]) {
    try {
      parseVersion(version);
      issues.push(`invalid SemVer was accepted: ${version}`);
    } catch {
      // Expected.
    }
  }
  if (issues.length > 0) throw new Error(issues.join("\n"));
}

const checks: Record<Part, () => void> = {
  content: validateContent,
  seo: validateSeoOutput,
  release: validateRelease,
};

function main() {
  const requested = process.argv.slice(2);
  const valid = requested.every(
    (part) => part === "all" || Object.hasOwn(checks, part),
  );
  if (
    requested.length === 0 ||
    !valid ||
    (requested.includes("all") && requested.length !== 1)
  ) {
    throw new Error(
      "Usage: npm run validate -- <content|seo|release|all> [...]",
    );
  }
  const parts =
    requested[0] === "all"
      ? (Object.keys(checks) as Part[])
      : (requested as Part[]);

  for (const part of [...new Set(parts)]) {
    checks[part]();
    console.log(`${part} validation passed.`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
