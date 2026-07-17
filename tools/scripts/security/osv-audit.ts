import { spawnSync } from "node:child_process";

const result = spawnSync(
  "go",
  [
    "run",
    "github.com/google/osv-scanner/v2/cmd/osv-scanner@v2.3.8",
    "--lockfile=package-lock.json",
  ],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
