import { readFileSync } from "node:fs";
import { parse } from "smol-toml";

export function parseContent(source: string, path: string) {
  if (source.length > 500_000)
    throw new Error(`${path}: content exceeds 500 KB`);
  try {
    return parse(source);
  } catch (error) {
    throw new Error(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readContent(name: "shared" | "en" | "es") {
  const path = new URL(
    `../../public/assets/content/${name}.toml`,
    import.meta.url,
  );
  return parseContent(readFileSync(path, "utf8"), path.pathname);
}

export const shared = readContent("shared");
export const translations = { en: readContent("en"), es: readContent("es") };
