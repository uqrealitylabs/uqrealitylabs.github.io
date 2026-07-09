import { readFileSync } from "node:fs";
import {
  buildLlms,
  buildRobots,
  buildSitemap,
  renderHeadBlock,
  validateSeo,
} from "../src/seo/seo.ts";
import { loadSeoInputs } from "./seo-inputs.ts";

const { site, pages } = loadSeoInputs();

const expected = new Map([
  ["public/robots.txt", buildRobots(site)],
  ["public/sitemap.xml", buildSitemap(site, pages)],
  ["public/llms.txt", buildLlms(site, pages)],
]);

const issues = validateSeo(site, pages);

for (const [path, value] of expected) {
  const actual = readFileSync(path, "utf8");
  if (actual !== value)
    issues.push(`${path} is stale; run npm run seo:generate`);
}

if (
  !readFileSync("index.html", "utf8").includes(
    renderHeadBlock(site, pages[0], pages),
  )
) {
  issues.push("index.html SEO head block is stale; run npm run seo:generate");
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("SEO output is valid.");
