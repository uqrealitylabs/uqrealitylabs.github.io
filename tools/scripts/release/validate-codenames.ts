import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  generateCodename,
  loadCatalog,
  parseVersion,
} from "./generate-codename.ts";

const catalogPath = "tools/config/release-codenames.json";
const catalog = loadCatalog(catalogPath);
const issues: string[] = [];

function unique(items: { slug: string; display: string }[], name: string) {
  const slugs = new Set<string>();
  for (const item of items) {
    if (!item.slug || !item.display) issues.push(`${name} item is incomplete`);
    if (slugs.has(item.slug))
      issues.push(`${name} duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
  }
}

for (const [name, items] of [
  ["animals", catalog.animals],
  ["birds", catalog.birds],
  ["insects", catalog.insects],
] as const) {
  if (!Array.isArray(items) || items.length < 32) {
    issues.push(`${name} must contain at least 32 entries`);
  } else {
    unique(items, name);
  }
}

const locked = new Map([
  ["0.0.0", "Quokka / Kookaburra / Firefly"],
  ["1.2.3", "Wombat / Fairy Wren / Bumblebee"],
  ["31.31.31", "Yak / Lapwing / Longhorn Beetle"],
  ["32.32.32", "Quokka II / Kookaburra II / Firefly II"],
  ["65.66.67", "Wombat III / Fairy Wren III / Bumblebee III"],
  ["1.2.3-beta.1", "Wombat / Fairy Wren / Bumblebee"],
]);

for (const [version, expected] of locked) {
  const actual = generateCodename(version, catalog);
  const label = `${actual.animal} / ${actual.bird} / ${actual.insect}`;
  if (label !== expected)
    issues.push(`${version}: expected ${expected}, got ${label}`);
}

try {
  parseVersion("nope");
  issues.push("invalid SemVer did not fail");
} catch {
  // Expected.
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

const hash = createHash("sha256")
  .update(readFileSync(catalogPath, "utf8"))
  .digest("hex");
console.log(`Release codenames valid. sha256=${hash}`);
