import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workflowRoot = ".github/workflows";

function workflowFiles(root = workflowRoot) {
  return readdirSync(root)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => join(root, file));
}

export function findWorkflowHardeningIssues(root = workflowRoot) {
  const issues: string[] = [];

  for (const file of workflowFiles(root)) {
    const text = readFileSync(file, "utf8");
    const needs = [
      ["permissions", /\npermissions:\n[\s\S]*?\bcontents:\s*read\b/],
      ["concurrency", /\nconcurrency:\n/],
      ["job timeout", /\n\s*timeout-minutes:\s*\d+/],
    ] as const;

    for (const [label, pattern] of needs) {
      if (!pattern.test(`\n${text}`)) issues.push(`${file} missing ${label}`);
    }

    if (
      text.includes("actions/checkout@") &&
      !text.includes("persist-credentials: false")
    ) {
      issues.push(`${file} checkout must disable credential persistence`);
    }
    if (text.includes("pull_request_target")) {
      issues.push(`${file} must not use pull_request_target`);
    }
    if (/\bcontents:\s*write\b/.test(text)) {
      issues.push(`${file} grants contents: write`);
    }
    if (/\bpath:\s*["']?\.(?:\/)?["']?\s*$/m.test(text)) {
      issues.push(`${file} uploads the whole workspace`);
    }
    if (/\beval\b|\|\s*(?:sh|bash)\b/.test(text)) {
      issues.push(`${file} contains unsafe shell execution`);
    }
    if (/\bnpm install\b/.test(text)) {
      issues.push(`${file} should use npm ci`);
    }
    if (
      /\bcache:\s*npm\b/.test(text) &&
      !text.includes("cache-dependency-path: package-lock.json")
    ) {
      issues.push(`${file} npm cache must include package-lock keying`);
    }
    if (text.includes("FirebaseExtended/action-hosting-deploy")) {
      issues.push(`${file} uses legacy Firebase secret-based deploy`);
    }
  }

  return issues;
}

if (process.argv[1]?.endsWith("assert-workflows-hardened.ts")) {
  const issues = findWorkflowHardeningIssues();
  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  console.log("Workflow hardening checks passed.");
}
