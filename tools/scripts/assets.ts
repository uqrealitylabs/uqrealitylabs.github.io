import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import sharp from "sharp";
import { places, portrait, terms } from "../../src/content/records.ts";

export async function writeAssets() {
  for (const place of places().filter(
    (p) => p.kind === "city" && p.name !== "Brisbane",
  )) {
    const path = `assets/world/${place.name.toLowerCase()}.json`;
    const data = JSON.parse(await readFile(`public/${path}`, "utf8"));
    // Coast geometry is already rasterised by Rust and need not travel to the browser
    delete data.coasts;
    delete data.sea;
    delete data.water;
    await writeFile(`dist/${path}`, JSON.stringify(data));
  }
  const people = [
    ...new Set(
      terms()
        .flatMap((term) => term.people.map((person) => person.photo))
        .filter(Boolean),
    ),
  ];
  for (const path of people) {
    const source = await sharp(`public${path}`)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const large = `dist${portrait(path, 800)}`;
    mkdirSync(dirname(large), { recursive: true });
    await sharp(source).toFile(large);
    await sharp(source)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`dist${portrait(path, 400)}`);
  }
  mkdirSync("dist/assets/brand", { recursive: true });
  const mark = readFileSync("public/assets/brand/mark.svg");
  await sharp(mark)
    .resize(180, 180)
    .flatten({ background: "#132330" })
    .png()
    .toFile("dist/assets/brand/touch.png");
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#132330"/><text x="70" y="110" font-family="sans-serif" font-size="24" fill="#d9d3be">THE UNIVERSITY OF QUEENSLAND / AR / VR</text><text x="60" y="290" font-family="sans-serif" font-size="118" fill="#eee9db">UQ REALITY</text><text x="60" y="420" font-family="sans-serif" font-size="118" fill="#c0d1c7">LABS</text><text x="70" y="560" font-family="sans-serif" font-size="28" fill="#eee9db">Augmented &amp; virtual reality at UQ</text><image x="900" y="360" width="220" height="220" href="data:image/svg+xml;base64,${mark.toString("base64")}"/></svg>`;
  await sharp(Buffer.from(card)).png().toFile("dist/assets/brand/share.png");
  const compress = async (directory: string) => {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, item.name);
      if (item.isDirectory()) await compress(path);
      else if (
        /\.(html|js|css|json|bin|wasm|task|svg|ics|xml|toml|md)$/.test(
          item.name,
        )
      ) {
        const bytes = await readFile(path);
        if (bytes.length < 1024) continue;
        const brotli = brotliCompressSync(bytes, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
        });
        const gzip = gzipSync(bytes, { level: 6 });
        if (brotli.length < bytes.length) await writeFile(`${path}.br`, brotli);
        if (gzip.length < bytes.length) await writeFile(`${path}.gz`, gzip);
      }
    }
  };
  await compress("dist");
}
