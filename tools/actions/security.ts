import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== "audit") {
  console.error("Usage: npm run security -- audit");
  process.exit(1);
}

const result = spawnSync("npm", ["audit", "--audit-level=moderate"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
