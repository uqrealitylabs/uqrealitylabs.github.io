export type Point = { x: number; y: number };

export function samplePolyline(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = points[index];
  const b = points[index + 1];

  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
  };
}

export function clampOrbOffset(offset: number, max = 10) {
  return Math.max(-max, Math.min(max, offset));
}

export function seededGaussian(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const u = Math.max(Number.EPSILON, x - Math.floor(x));
  const y = Math.sin((seed + 1) * 78.233) * 43758.5453;
  const v = Math.max(Number.EPSILON, y - Math.floor(y));
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
