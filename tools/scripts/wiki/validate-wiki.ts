import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const wikiIndex = process.argv.indexOf("--wiki");
const wiki =
  wikiIndex === -1
    ? "../uqrealitylabs.github.io.wiki"
    : process.argv[wikiIndex + 1];
const required = [
  "Home.md",
  "_Sidebar.md",
  "_Footer.md",
  "Start-Here.md",
  "Architecture.md",
  "Development.md",
  "Testing-and-Coverage.md",
  "CI-CD.md",
  "Releases-and-Codenames.md",
  "Security.md",
  "Troubleshooting.md",
  "Decisions.md",
];
const issues: string[] = [];

if (!wiki || !existsSync(wiki)) {
  issues.push(`wiki path does not exist: ${wiki}`);
} else {
  for (const file of required) {
    const path = join(wiki, file);
    if (!existsSync(path)) {
      issues.push(`missing wiki page: ${file}`);
    } else if (statSync(path).size === 0) {
      issues.push(`empty wiki page: ${file}`);
    } else if (
      /\/Users\/|BEGIN [A-Z ]*PRIVATE KEY|PRIVATE KEY-----/.test(
        readFileSync(path, "utf8"),
      )
    ) {
      issues.push(`unsafe wiki content: ${file}`);
    }
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Wiki pages are valid.");
