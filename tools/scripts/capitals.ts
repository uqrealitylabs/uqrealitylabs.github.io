import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { parse } from "smol-toml";

// The editable destinations and their derived OSM extracts share one geographic source
const joinRings = (segments: number[][][]) => {
  const equal = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];
  const result: number[][][] = [];
  while (segments.length) {
    const chain = segments.pop()!;
    for (
      let i = segments.length - 1;
      i >= 0 && !equal(chain[0], chain.at(-1)!);
      i--
    ) {
      const part = segments[i];
      if (equal(chain.at(-1)!, part[0])) chain.push(...part.slice(1));
      else if (equal(chain.at(-1)!, part.at(-1)!))
        chain.push(...part.slice(0, -1).reverse());
      else if (equal(chain[0], part.at(-1)!))
        chain.unshift(...part.slice(0, -1));
      else if (equal(chain[0], part[0]))
        chain.unshift(...part.slice(1).reverse());
      else continue;
      segments.splice(i, 1);
      i = segments.length;
    }
    if (equal(chain[0], chain.at(-1)!)) result.push(chain);
  }
  return result;
};
const source = parse(
  await readFile("public/assets/content/world.toml", "utf8"),
);
const places = (
  source.places as {
    name: string;
    kind: string;
    longitude: number;
    latitude: number;
    sea?: [number, number];
  }[]
).filter((p) => p.kind === "city" && p.name !== "Brisbane");
await mkdir("work/world/capitals", { recursive: true });
for (const place of places) {
  const slug = place.name.toLowerCase();
  const raw = `work/world/capitals/${slug}.json`;
  let data: {
    elements: {
      type: string;
      id: number;
      tags?: Record<string, string>;
      geometry?: { lon: number; lat: number }[];
      members?: { role: string; geometry?: { lon: number; lat: number }[] }[];
    }[];
  };
  try {
    data = JSON.parse(await readFile(raw, "utf8"));
  } catch {
    const query = `[out:json][timeout:90];(way(around:3500,${place.latitude},${place.longitude})[building];way(around:3500,${place.latitude},${place.longitude})[highway];way(around:5000,${place.latitude},${place.longitude})[natural=water];way(around:3500,${place.latitude},${place.longitude})[leisure=park];rel(around:7000,${place.latitude},${place.longitude})[natural=water];);out geom;`;
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "UQRL-website-map-preparation/1.0",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(100000),
    });
    if (!response.ok) throw new Error(`${slug} source: ${response.status}`);
    const text = await response.text();
    if (text.length > 60_000_000) throw new Error("Extract budget exceeded");
    data = JSON.parse(text);
    if (!Array.isArray(data.elements))
      throw new Error("Missing geographic ways");
    await writeFile(raw, text);
  }
  const buildings = [],
    roads = [],
    areas = [];
  for (const item of data.elements) {
    const t = item.tags ?? {};
    const points = item.geometry?.map((p) => [p.lon, p.lat]);
    if (!points || points.length < 2 || points.length > 12000) continue;
    if (t.building && points.length > 3) {
      const height = Math.min(
        399,
        Math.max(
          3.5,
          Number.parseFloat(t.height) ||
            (Number.parseFloat(t["building:levels"]) || 3) * 3.5,
        ),
      );
      buildings.push({
        id: item.id,
        name: t.name ?? "",
        height,
        roof: t["roof:shape"] ?? "flat",
        points,
      });
    }
    if (t.highway)
      roads.push({
        name: t.name ?? "",
        kind: t.highway,
        bridge: !!t.bridge && t.bridge !== "no",
        width: Math.max(
          1,
          Math.min(
            40,
            Number.parseFloat(t.width) ||
              (["footway", "path", "steps", "cycleway"].includes(t.highway)
                ? 2
                : 10),
          ),
        ),
        points,
      });
    if (t.natural === "water" || t.leisure === "park")
      areas.push({
        name: t.name ?? "",
        kind: t.natural === "water" ? "water" : "green",
        points,
      });
  }
  buildings.sort(
    (a, b) => Number(!!b.name) - Number(!!a.name) || b.height - a.height,
  );
  let coasts: number[][][] | undefined;
  if (place.sea) {
    try {
      coasts = JSON.parse(
        await readFile(`public/assets/world/${slug}.json`, "utf8"),
      ).coasts;
    } catch {
      /* Source extracts can be prepared from an empty checkout */
    }
    if (!coasts) {
      const [lon, lat] = place.sea;
      const box = [
        Math.min(place.latitude - 0.13, lat - 0.03),
        Math.min(place.longitude - 0.13, lon - 0.03),
        Math.max(place.latitude + 0.13, lat + 0.03),
        Math.max(place.longitude + 0.13, lon + 0.03),
      ].join(",");
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "UQRL-website-map-preparation/1.0",
        },
        body: new URLSearchParams({
          data: `[out:json][timeout:60];way["natural"="coastline"](${box});out geom;`,
        }),
        signal: AbortSignal.timeout(70000),
      });
      if (!response.ok)
        throw new Error(`${slug} coastline: ${response.status}`);
      const source = await response.json();
      if (!Array.isArray(source.elements))
        throw new Error("Missing coastline ways");
      coasts = source.elements.map(
        (item: { geometry: { lon: number; lat: number }[] }) =>
          item.geometry.map((point) => [point.lon, point.lat]),
      );
    }
  }
  const water = data.elements
    .filter((item) => item.members)
    .map((relation) => {
      const collect = (inner: boolean) =>
        joinRings(
          (relation.members ?? [])
            .filter(
              (m) =>
                (inner ? m.role === "inner" : m.role !== "inner") &&
                m.geometry?.length,
            )
            .map((m) => m.geometry!.map((p) => [p.lon, p.lat])),
        );
      return { outers: collect(false), inners: collect(true) };
    })
    .filter((water) => water.outers.length);
  let previousWater = [];
  if (!water.length) {
    try {
      previousWater =
        JSON.parse(await readFile(`public/assets/world/${slug}.json`, "utf8"))
          .water ?? [];
    } catch {
      /* Fresh extracts have no prior water data */
    }
  }
  const result = {
    buildings: buildings.slice(0, 8000),
    roads: roads.slice(0, 20000),
    areas: areas.slice(0, 5000),
    rivers: [],
    water: water.length ? water : previousWater,
    ...(coasts ? { coasts, sea: place.sea } : {}),
  };
  await writeFile(`public/assets/world/${slug}.json`, JSON.stringify(result));
  console.log(
    `${place.name}: ${result.buildings.length} buildings, ${result.roads.length} roads and paths, ${result.areas.length} green/water boundaries`,
  );
}

for (const place of places) {
  const target = `public/assets/world/${place.name.toLowerCase()}-elevation.json`;
  try {
    await readFile(target);
    continue;
  } catch {
    /* Generate a missing elevation extract */
  }
  const tiles = new Map<string, Promise<Buffer>>();
  const width = 129,
    span = 0.22;
  const west = place.longitude - span / 2,
    east = place.longitude + span / 2;
  const north = place.latitude + span / 2,
    south = place.latitude - span / 2;
  const samples: number[] = [];
  for (let y = 0; y < width; y++)
    for (let x = 0; x < width; x++) {
      const lon = west + (x / (width - 1)) * span,
        lat = north - (y / (width - 1)) * span;
      const u = ((lon + 180) / 360) * 2048;
      const v =
        ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) *
        2048;
      const key = `${Math.floor(u)}/${Math.floor(v)}`;
      if (!tiles.has(key))
        tiles.set(
          key,
          (async () => {
            const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/11/${key}.png`;
            const response = await fetch(url, {
              signal: AbortSignal.timeout(20000),
            });
            if (!response.ok)
              throw new Error(`Terrain provider: ${response.status}`);
            return sharp(await response.arrayBuffer())
              .removeAlpha()
              .raw()
              .toBuffer();
          })(),
        );
      const tile = await tiles.get(key)!;
      const i =
        (Math.floor((v % 1) * 256) * 256 + Math.floor((u % 1) * 256)) * 3;
      samples.push(
        Math.max(
          0,
          Math.round(tile[i] * 256 + tile[i + 1] + tile[i + 2] / 256 - 32768),
        ),
      );
    }
  await writeFile(
    target,
    JSON.stringify({ width, height: width, west, east, south, north, samples }),
  );
  console.log(
    `${place.name}: terrain sampled from ${tiles.size} Terrarium tiles`,
  );
}
