import { readFileSync, writeFileSync } from "node:fs";
import {
  buildLlms,
  buildRobots,
  buildSitemap,
  renderHeadBlock,
  selectIndexPage,
} from "../../src/seo/seo.ts";
import { loadSeoInputs } from "./seo-inputs.ts";

const headPattern = / {4}<!-- uqrl:seo:start -->[\s\S]*?<!-- uqrl:seo:end -->/;
const { site, pages } = loadSeoInputs();

function updateIndex() {
  const indexPath = "index.html";
  const html = readFileSync(indexPath, "utf8");
  const block = `    ${renderHeadBlock(site, selectIndexPage(site, pages), pages)}`;
  const next = headPattern.test(html)
    ? html.replace(headPattern, block)
    : html.replace("    <title>UQ Reality Labs</title>", block);
  writeFileSync(indexPath, next);
}

writeFileSync("public/robots.txt", buildRobots(site));
writeFileSync("public/sitemap.xml", buildSitemap(site, pages));
writeFileSync("public/llms.txt", buildLlms(site, pages));
updateIndex();

console.log("SEO files generated.");
