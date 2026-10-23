import { locate } from "./geography";

type Elevation = {
  width: number;
  height: number;
  west: number;
  east: number;
  south: number;
  north: number;
  samples: number[];
};
export function parseElevation(value: unknown): Elevation {
  if (!value || typeof value !== "object")
    throw new Error("Invalid elevation source");
  const data = value as Elevation;
  if (
    !Number.isInteger(data.width) ||
    !Number.isInteger(data.height) ||
    data.width < 2 ||
    data.height < 2 ||
    data.width * data.height > 100_000 ||
    ![data.west, data.east, data.south, data.north].every(Number.isFinite) ||
    data.east <= data.west ||
    data.north <= data.south ||
    !Array.isArray(data.samples) ||
    data.samples.length !== data.width * data.height ||
    data.samples.some((n) => !Number.isFinite(n) || n < -100 || n > 2000)
  )
    throw new Error("Invalid elevation grid");
  return data;
}

/** River exclusion uses the same width as the visible water mesh */
export function terrain(source: Elevation, rivers: [number, number][][]) {
  const edges = rivers.flatMap((river) =>
    river.slice(1).map((p, i) => [locate(river[i]), locate(p)]),
  );
  const withinRiver = (x: number, z: number, width: number) =>
    edges.some(([a, b]) => {
      const dx = b.x - a.x,
        dz = b.y - a.y,
        length = dx * dx + dz * dz;
      const t = length
        ? Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.y) * dz) / length))
        : 0;
      return (x - a.x - t * dx) ** 2 + (z - a.y - t * dz) ** 2 < width ** 2;
    });
  const waterAt = (x: number, z: number) => withinRiver(x, z, 2.8);
  const heightAt = (x: number, z: number) => {
    if (withinRiver(x, z, 5.5)) return 0;
    const lon = 153.01302 + x / 2469,
      lat = -27.4974 - z / 2783;
    const u = Math.min(
      source.width - 1,
      Math.max(
        0,
        ((lon - source.west) / (source.east - source.west)) *
          (source.width - 1),
      ),
    );
    const v = Math.min(
      source.height - 1,
      Math.max(
        0,
        ((source.north - lat) / (source.north - source.south)) *
          (source.height - 1),
      ),
    );
    const a = Math.floor(u),
      b = Math.floor(v),
      c = Math.min(source.width - 1, a + 1),
      d = Math.min(source.height - 1, b + 1),
      f = u - a,
      g = v - b;
    const top =
      source.samples[b * source.width + a] * (1 - f) +
      source.samples[b * source.width + c] * f;
    const bottom =
      source.samples[d * source.width + a] * (1 - f) +
      source.samples[d * source.width + c] * f;
    return Math.max(0, top * (1 - g) + bottom * g) / 40;
  };
  return { heightAt, waterAt };
}
