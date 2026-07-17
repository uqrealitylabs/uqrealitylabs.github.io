import { readFileSync } from "node:fs";

type CodenameItem = { slug: string; display: string };
type CodenameCatalog = {
  schemaVersion: number;
  catalogVersion: number;
  animals: CodenameItem[];
  birds: CodenameItem[];
  insects: CodenameItem[];
};

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function parseVersion(version: string) {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) throw new Error(`Invalid SemVer: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function loadCatalog(path = "tools/config/release-codenames.json") {
  return JSON.parse(readFileSync(path, "utf8")) as CodenameCatalog;
}

function pick(items: CodenameItem[], value: number) {
  const item = items[value % items.length];
  const cycle = Math.floor(value / items.length);
  const suffix = cycle === 0 ? "" : ` ${roman[cycle] ?? String(cycle + 1)}`;
  return `${item.display}${suffix}`;
}

export function generateCodename(version: string, catalog = loadCatalog()) {
  const { major, minor, patch } = parseVersion(version);
  return {
    version: `${major}.${minor}.${patch}`,
    animal: pick(catalog.animals, major),
    bird: pick(catalog.birds, minor),
    insect: pick(catalog.insects, patch),
  };
}

if (process.argv[1]?.endsWith("generate-codename.ts")) {
  const version = process.argv[2];
  if (!version) {
    console.error("Usage: npm run release:codename -- <version>");
    process.exit(1);
  }
  const codename = generateCodename(version);
  console.log(
    `v${codename.version} — ${codename.animal} / ${codename.bird} / ${codename.insect}`,
  );
}
