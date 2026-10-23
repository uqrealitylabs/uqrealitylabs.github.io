import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 8_000_000 }).trim();
const base = "origin/main";
const refs = git(
  "for-each-ref",
  "--format=%(refname:short)|%(objectname)",
  "refs/heads",
  "refs/remotes",
)
  .split("\n")
  .filter((line) => !line.startsWith("origin|"));
const report = refs.map((row) => {
  const [ref, sha] = row.split("|");
  const commits = git("log", "--reverse", "--format=%h %s", `${base}..${ref}`)
    .split("\n")
    .filter(Boolean);
  const patches = git("cherry", base, ref)
    .split("\n")
    .filter((line) => line.startsWith("+"));
  let decision =
    commits.length === 0
      ? "Already included in the main history or an ancestor — no merge needed"
      : "Reviewed as historical work — use the current implementation and content contracts instead of merging an older whole-site snapshot";
  if (/better-mobile|sauron/.test(ref))
    decision =
      "Ported the useful invariants: normalised assets, responsive framing, readiness and visibility budgets — the new local Three owner replaces the extracted package/runtime approach";
  if (/better-resp/.test(ref))
    decision =
      "Already in main history — reviewed its original emblem, playful committee treatment, rainbow glow and tactile social experiments; the current connected lab develops that character without restoring canvas-owned text or single-page routing";
  if (/r3f/.test(ref))
    decision =
      "Alternative React/R3F extraction — retain React with static generation and selective hydration; no extracted scene dependency required";
  if (/gen-commit|temp-mobile/.test(ref))
    decision =
      "Recovered the general committee portraits, Nuaxion and Talk All Sport assets — their 2026 term was confirmed by the maintainer and imported into TOML";
  if (/dependabot/.test(ref))
    decision = /github_actions/.test(ref)
      ? "Applied the latest pinned action versions from these update branches to the active workflows"
      : "Resolved against the new dependency graph and current stable packages; removed dependencies are not reintroduced";
  if (ref === "2027-fix")
    decision =
      "Active implementation branch based on refreshed origin/main; working tree changes are not represented by this branch tip yet";
  return {
    ref,
    sha,
    uniqueCommits: commits.length,
    nonEquivalentPatches: patches.length,
    decision,
    commits,
    diff: git("diff", "--stat", `${base}...${ref}`),
  };
});
mkdirSync("out/artifacts", { recursive: true });
writeFileSync(
  "out/artifacts/branches.json",
  `${JSON.stringify({ base, baseSha: git("rev-parse", base), refs: report }, null, 2)}\n`,
);
writeFileSync(
  "out/artifacts/branches.md",
  [
    "# Branch integration audit",
    "",
    `Compared with ${base} at ${git("rev-parse", base)}`,
    "",
    "Unique commits are ancestry differences, while non-equivalent patches exclude patch-equivalent cherry-picks",
    "No branches were reset, deleted, merged or pushed",
    "",
    "| Ref | SHA | Unique commits | Non-equivalent patches | Decision |",
    "| --- | --- | ---: | ---: | --- |",
    ...report.map(
      (item) =>
        `| ${item.ref} | ${item.sha.slice(0, 12)} | ${item.uniqueCommits} | ${item.nonEquivalentPatches} | ${item.decision} |`,
    ),
    "",
    ...report.flatMap((item) => [
      `## ${item.ref}`,
      "",
      item.decision,
      "",
      ...(item.commits.length
        ? item.commits.map((line) => `- ${line}`)
        : ["No unique commits"]),
      "",
      ...(item.diff ? ["```text", item.diff, "```", ""] : []),
    ]),
  ].join("\n"),
);
console.log(
  `Audited ${report.length} local and remote refs into out/artifacts/branches.md`,
);
