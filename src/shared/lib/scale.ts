export type Viewport = {
  width: number;
  height: number;
  remPx: number;
};

export function siteScale({ width, remPx }: Viewport) {
  const viewportPart = width / 1440;
  const remPart = remPx / 16;
  return Number(
    Math.min(
      1.35,
      Math.max(0.85, viewportPart * 0.55 + remPart * 0.45),
    ).toFixed(3),
  );
}

export function prefersReducedMotion(
  query = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)"),
) {
  return Boolean(query?.matches);
}
