import { mkdirSync, writeFileSync } from "node:fs";
import { settings } from "./settings.ts";

mkdirSync("out/artifacts/handoff/constitution/.github/workflows", {
  recursive: true,
});
writeFileSync(
  "out/artifacts/handoff/constitution/.github/workflows/publish.yml",
  JSON.stringify(settings("publisher"), null, 2),
);
writeFileSync(
  "out/artifacts/handoff/constitution/README.md",
  `# Constitution publisher handoff\n\nCopy .github/workflows/publish.yml into uqrealitylabs/constitution through its normal review process\nOnly main is authoritative — never publish the local final branch\nThe workflow builds Constitution.md plus approved Markdown under policies/ without modifying the legal wording\nA source revision has one immutable published release, with PDF, SHA-256 and source manifest\nA failed draft does not replace the latest successful release and requires inspection before retrying\n\nLatest successful publication API: https://api.github.com/repos/uqrealitylabs/constitution/releases/latest\nPDF origin: https://github.com/uqrealitylabs/constitution/releases/latest/download/constitution.pdf\nPlanned public URL: https://cdn.uqrealitylabs.com/constitution.pdf\n\nThe website and bot should use that CDN only after it serves a verified release\nSet the CDN cache to revalidate the latest redirect and cache versioned release assets immutably\nThe current main has no approved policy directory or successful PDF publication — this handoff does not invent either\nThis workflow has not been installed or run in the constitution repository\n`,
);
console.log(
  "Prepared the constitution publisher handoff under out/artifacts/handoff/constitution",
);
