import { readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const forbidden = new Set([".js", ".jsx", ".mjs", ".cjs"]);
const ignored = new Set([
  ".git",
  ".rsbuild",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "cypress/screenshots",
  "cypress/videos",
  "dist",
  "node_modules",
]);

function isIgnored(path: string) {
  return [...ignored].some(
    (entry) => path === entry || path.startsWith(`${entry}/`),
  );
}

export function findForbiddenJavaScript(root = process.cwd()) {
  const matches: string[] = [];
  const visit = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const fullPath = join(dir, name);
      const projectPath = relative(root, fullPath);
      if (isIgnored(projectPath)) continue;
      const stats = statSync(fullPath);
      if (stats.isDirectory()) visit(fullPath);
      else if (forbidden.has(extname(name))) matches.push(projectPath);
    }
  };

  visit(root);
  return matches.sort();
}

if (process.argv[1]?.endsWith("assert-no-js.ts")) {
  const matches = findForbiddenJavaScript();
  if (matches.length > 0) {
    console.error(
      `Forbidden first-party JavaScript files:\n${matches.join("\n")}`,
    );
    process.exit(1);
  }
  console.log("No first-party JavaScript source/config/script files found.");
}
