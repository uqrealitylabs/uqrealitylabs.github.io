import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { arch, cpus, platform, release } from "node:os";
import { dirname, join, relative } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const budgets = {
  baseJsGzip: 180 * 1024,
  cssGzip: 35 * 1024,
  largestLazyJsGzip: 320 * 1024,
};

type Asset = {
  path: string;
  bytes: number;
  gzip: number;
  brotli: number;
};

function walk(dir: string, root = dir) {
  const assets: Asset[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stats = statSync(full);
    if (stats.isDirectory()) assets.push(...walk(full, root));
    else if (/\.(css|js|html)$/.test(name)) {
      const data = readFileSync(full);
      const bytes = Uint8Array.from(data);
      assets.push({
        path: relative(root, full),
        bytes: data.length,
        gzip: gzipSync(bytes).length,
        brotli: brotliCompressSync(bytes).length,
      });
    }
  }
  return assets.sort((a, b) => a.path.localeCompare(b.path));
}

function initialScriptPaths() {
  const html = readFileSync("dist/index.html", "utf8");
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)["']/g)].map(
    (match) =>
      new URL(match[1], "https://build.invalid/").pathname.replace(/^\/+/, ""),
  );
}

function gitValue(args: string[]) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function formatBytes(value: number) {
  return `${(value / 1024).toFixed(1)} KiB`;
}

function collect() {
  if (!existsSync("dist")) {
    throw new Error("dist does not exist; run npm run build first");
  }

  const assets = walk("dist");
  const initialScripts = new Set(initialScriptPaths());
  const baseJsGzip = assets
    .filter((asset) => initialScripts.has(asset.path))
    .reduce((total, asset) => total + asset.gzip, 0);
  const css = assets
    .filter((asset) => asset.path.endsWith(".css"))
    .reduce((total, asset) => total + asset.gzip, 0);
  const lazyJs = assets
    .filter(
      (asset) => asset.path.endsWith(".js") && !initialScripts.has(asset.path),
    )
    .sort((a, b) => b.gzip - a.gzip)[0];

  return {
    date: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? gitValue(["rev-parse", "HEAD"]),
    branch:
      process.env.GITHUB_REF_NAME ??
      gitValue(["rev-parse", "--abbrev-ref", "HEAD"]),
    runner: process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "local",
    os: `${platform()} ${release()} ${arch()}`,
    cpu: cpus()[0]?.model ?? "unknown",
    node: process.version,
    npm: process.env.npm_config_user_agent ?? "unknown",
    assets,
    initialScripts: [...initialScripts],
    summary: {
      baseJsGzip,
      cssGzip: css,
      largestLazyJsGzip: lazyJs?.gzip ?? 0,
      largestLazyJsPath: lazyJs?.path ?? "none",
    },
    budgets,
  };
}

function markdown(report: ReturnType<typeof collect>) {
  const { summary } = report;
  return [
    "## Build benchmark",
    "",
    `- Commit: ${report.commit}`,
    `- Branch: ${report.branch}`,
    `- Runner: ${report.runner}`,
    `- OS: ${report.os}`,
    `- Node: ${report.node}`,
    "",
    "| Metric | Value | Budget |",
    "| --- | ---: | ---: |",
    `| Base JS gzip | ${formatBytes(summary.baseJsGzip)} | ${formatBytes(budgets.baseJsGzip)} |`,
    `| CSS gzip | ${formatBytes(summary.cssGzip)} | ${formatBytes(budgets.cssGzip)} |`,
    `| Largest lazy JS gzip | ${formatBytes(summary.largestLazyJsGzip)} | ${formatBytes(budgets.largestLazyJsGzip)} |`,
    "",
  ].join("\n");
}

function budgetIssues(report: ReturnType<typeof collect>) {
  const checks = [
    ["base JS gzip", report.summary.baseJsGzip, budgets.baseJsGzip],
    ["CSS gzip", report.summary.cssGzip, budgets.cssGzip],
    [
      `largest lazy JS gzip (${report.summary.largestLazyJsPath})`,
      report.summary.largestLazyJsGzip,
      budgets.largestLazyJsGzip,
    ],
  ] as const;

  return checks
    .filter(([, actual, budget]) => actual > budget)
    .map(
      ([label, actual, budget]) =>
        `${label}: ${formatBytes(actual)} exceeds ${formatBytes(budget)}`,
    );
}

const args = process.argv.slice(2);

try {
  const report = collect();
  const issues = args.includes("--check-budgets") ? budgetIssues(report) : [];
  const outIndex = args.indexOf("--out");
  if (outIndex !== -1) {
    const out = args[outIndex + 1];
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(out.replace(/\.json$/, ".md"), markdown(report));
  }

  console.log(markdown(report));

  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
