import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "dist";
const walk = (path: string): string[] =>
  readdirSync(path).flatMap((name) => {
    const file = join(path, name);
    return statSync(file).isDirectory()
      ? walk(file)
      : file.endsWith(".html")
        ? [file]
        : [];
  });
const files = walk(root);
assert(
  files.length >= 3,
  "Build the site before verifying its generated routes",
);
const ids = new Map<string, Set<string>>();
for (const file of files) {
  const matches = [
    ...readFileSync(file, "utf8").matchAll(/\bid="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.equal(
    new Set(matches).size,
    matches.length,
    `${file} contains duplicate IDs`,
  );
  ids.set(file, new Set(matches));
}
for (const file of files) {
  const html = readFileSync(file, "utf8");
  assert.equal(
    [...html.matchAll(/<title>/g)].length,
    1,
    `${file} must have exactly one title`,
  );
  const links = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const [, set] of html.matchAll(/\bsrcSet="([^"]+)"/gi))
    links.push(...set.split(",").map((item) => item.trim().split(" ")[0]));
  for (const url of links.filter(
    (link) => link.startsWith("/") || link.startsWith("#"),
  )) {
    const [path, hash] = url.split("#");
    const target = path
      ? join(root, path.split("?")[0], path.endsWith("/") ? "index.html" : "")
      : file;
    assert(existsSync(target), `${file} points to missing ${url}`);
    if (hash)
      assert(
        ids.get(target)?.has(hash),
        `${file} points to missing anchor ${url}`,
      );
  }
}
console.log(
  `Verified links, generated assets and unique IDs across ${files.length} HTML pages`,
);
