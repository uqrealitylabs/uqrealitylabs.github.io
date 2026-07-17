import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const sourceDir = "public/Assets";
const outputDir = "public/Assets/optimized";
mkdirSync(outputDir, { recursive: true });

const models = readdirSync(sourceDir).filter(
  (file) => extname(file).toLowerCase() === ".glb",
);

if (models.length === 0) {
  console.log("No GLB assets found.");
  process.exit(0);
}

for (const model of models) {
  const input = join(sourceDir, model);
  const output = join(outputDir, model);
  const result = spawnSync(
    "npx",
    ["gltf-transform", "optimize", input, output, "--compress", "meshopt"],
    { stdio: "inherit" },
  );

  if (result.status !== 0) process.exit(result.status ?? 1);
}
