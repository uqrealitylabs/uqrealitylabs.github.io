import { execFileSync } from "node:child_process";
import { generateCodename } from "./generate-codename.ts";

const tag = process.env.RELEASE_TAG ?? process.argv[2];
if (!tag) {
  console.error("Set RELEASE_TAG or pass a tag like v1.2.3.");
  process.exit(1);
}

const codename = generateCodename(tag);
const title = `v${codename.version} — ${codename.animal} / ${codename.bird} / ${codename.insect}`;
const existing = execFileSync(
  "gh",
  ["release", "view", tag, "--json", "body", "-q", ".body"],
  {
    encoding: "utf8",
  },
);
const prefix = `Codename: ${codename.animal} / ${codename.bird} / ${codename.insect}`;
const body = existing.startsWith(prefix)
  ? existing
  : `${prefix}\n\n${existing}`;

execFileSync(
  "gh",
  ["release", "edit", tag, "--title", title, "--notes", body],
  {
    stdio: "inherit",
  },
);
