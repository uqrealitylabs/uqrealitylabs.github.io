import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import {
  getSiteContent,
  listPages,
} from "../../src/content/contentRegistry.ts";
import {
  buildLlms,
  buildRobots,
  buildSitemap,
  renderHeadBlock,
} from "../../src/seo/seo.ts";

const headPattern = / {4}<!-- uqrl:seo:start -->[\s\S]*?<!-- uqrl:seo:end -->/;
const semverPattern =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const consonants = "bcdfghjklmnprstvwxz";
const vowels = "aeiou";

export function parseVersion(version: string) {
  const match = version.match(semverPattern);
  if (!match) throw new Error(`Invalid SemVer: ${version}`);
  return `${match[1]}.${match[2]}.${match[3]}`;
}

function word(bytes: ArrayLike<number>, offset: number) {
  let value = "";
  for (let index = 0; index < 3; index += 1) {
    value += consonants[bytes[offset + index * 2] % consonants.length];
    value += vowels[bytes[offset + index * 2 + 1] % vowels.length];
  }
  return value[0].toUpperCase() + value.slice(1);
}

export function generateCodename(version: string) {
  const normalized = parseVersion(version);
  const digest = createHash("sha256").update(normalized).digest();
  const words = [word(digest, 0), word(digest, 6), word(digest, 12)];
  return {
    version: normalized,
    words,
    label: words.join(" / "),
  };
}

function generateSeo() {
  const site = getSiteContent("en");
  const pages = listPages("en");
  const html = readFileSync("index.html", "utf8");
  const block = `    ${renderHeadBlock(site, pages[0])}`;

  writeFileSync("public/robots.txt", buildRobots(site));
  writeFileSync("public/sitemap.xml", buildSitemap(site, pages));
  writeFileSync("public/llms.txt", buildLlms(site, pages));
  writeFileSync(
    "index.html",
    headPattern.test(html)
      ? html.replace(headPattern, block)
      : html.replace("    <title>UQ Reality Labs</title>", block),
  );
  console.log("SEO files generated.");
}

function main() {
  const args = process.argv.slice(2);
  const [part, value] = args;
  if (part === "seo" && args.length === 1) return generateSeo();
  if (part === "codename" && value && args.length === 2) {
    const codename = generateCodename(value);
    console.log(`v${codename.version} — ${codename.label}`);
    return;
  }
  throw new Error("Usage: npm run generate -- <seo|codename VERSION>");
}

if (basename(process.argv[1] ?? "") === "generate.ts") {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
