import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type LayoutConfig = {
  requiredPaths: string[];
  forbiddenTopLevelPaths: string[];
  allowedRootConfigShims: string[];
  generatedPaths: string[];
  allowedSingleFileDirs: string[];
};

const config = JSON.parse(
  await import("node:fs").then(({ readFileSync }) =>
    readFileSync("tools/config/repo-layout.json", "utf8"),
  ),
) as LayoutConfig;

const issues: string[] = [];

for (const path of config.requiredPaths) {
  if (!existsSync(path)) issues.push(`missing required path: ${path}`);
}

for (const path of config.forbiddenTopLevelPaths) {
  if (existsSync(path)) issues.push(`forbidden top-level path: ${path}`);
}

function isTracked(path: string) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", path], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

for (const path of config.generatedPaths) {
  if (existsSync(path) && isTracked(path))
    issues.push(`generated output is tracked: ${path}`);
}

for (const file of readdirSync(".")) {
  if (
    /(?:config|rc)\.(?:js|cjs|mjs|ts|json)$/.test(file) &&
    !config.allowedRootConfigShims.includes(file)
  ) {
    issues.push(`root config must move under tools/config: ${file}`);
  }
}

function walk(dir: string) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  const files = entries.filter((entry) => statSync(join(dir, entry)).isFile());
  const dirs = entries.filter((entry) =>
    statSync(join(dir, entry)).isDirectory(),
  );
  const projectPath = relative(".", dir);
  if (entries.length === 0) issues.push(`empty directory: ${projectPath}`);
  if (
    files.length === 1 &&
    dirs.length === 0 &&
    !config.allowedSingleFileDirs.includes(projectPath)
  ) {
    issues.push(`pointless one-file directory: ${projectPath}`);
  }
  for (const child of dirs) walk(join(dir, child));
}

for (const root of ["src", "tests", "tools"]) walk(root);

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Repository layout is valid.");
