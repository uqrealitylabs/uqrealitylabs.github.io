import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "smol-toml";

const directory = resolve("out/tools/native");
const binary = resolve("out/tools/bindgen/bin/wasm-bindgen");
const manifest = "tools/config/Cargo.toml";
const version = String(
  (
    parse(readFileSync(manifest, "utf8")).dependencies as Record<string, string>
  )["wasm-bindgen"],
).replace(/^=/, "");
const env = { ...process.env, CARGO_TARGET_DIR: resolve("out/.cache/cargo") };
if (process.argv.includes("--setup")) {
  execFileSync("rustup", ["target", "add", "wasm32-unknown-unknown"], {
    stdio: "inherit",
  });
  execFileSync(
    "cargo",
    [
      "install",
      "wasm-bindgen-cli",
      "--version",
      version,
      "--locked",
      "--root",
      "out/tools/bindgen",
    ],
    {
      stdio: "inherit",
      env: { ...env, CARGO_TARGET_DIR: resolve("out/.cache/bindgen") },
    },
  );
}
if (!existsSync(binary))
  throw new Error(
    "Rust WASM bindings are missing — run npm run setup:rust first",
  );
mkdirSync(directory, { recursive: true });
execFileSync(
  "cargo",
  [
    "build",
    "--lib",
    "--release",
    "--locked",
    "--target",
    "wasm32-unknown-unknown",
    "--manifest-path",
    manifest,
  ],
  { stdio: "inherit", env },
);
execFileSync(
  "cargo",
  [
    "run",
    "--release",
    "--bin",
    "bake",
    "--manifest-path",
    manifest,
    "--",
    "public/assets/world",
    "out/tools/world",
  ],
  { stdio: "inherit", env },
);
execFileSync(
  binary,
  [
    "out/.cache/cargo/wasm32-unknown-unknown/release/uqrl_world.wasm",
    "--target",
    "web",
    "--out-dir",
    directory,
    "--out-name",
    "world",
    "--no-typescript",
  ],
  { stdio: "inherit" },
);
