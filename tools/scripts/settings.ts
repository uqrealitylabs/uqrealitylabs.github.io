import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parse } from "smol-toml";

const configuration = parse(
  readFileSync(new URL("../config/tools.toml", import.meta.url), "utf8"),
);

export function settings(name: string) {
  if (!Object.hasOwn(configuration, name))
    throw new Error(`Unknown tool configuration: ${name}`);
  const directory = new URL("../../out/tools/", import.meta.url);
  mkdirSync(directory, { recursive: true });
  const output = new URL(
    `${name === "typescript" ? "tsconfig" : name}.json`,
    directory,
  );
  const text = `${JSON.stringify(configuration[name], null, 2)}\n`;
  writeFileSync(output, text);
  // Native tool mergers require ordinary objects rather than TOML's null-prototype tables
  return JSON.parse(text);
}

/** TOML is the editable source; native tool JSON is disposable output */
export function generateSettings() {
  for (const name of Object.keys(configuration)) settings(name);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  generateSettings();
