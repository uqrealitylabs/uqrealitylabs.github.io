export type EyeExpression = "idle" | "happy" | "sad";

export function seededUnit(seed: number, index: number) {
  const value = Math.sin((seed + 1) * 12.9898 + index * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

export function createWinkSchedule(
  seed: number,
  options: { minMs?: number; maxMs?: number } = {},
) {
  const minMs = options.minMs ?? 2600;
  const maxMs = options.maxMs ?? 6200;

  return (winkIndex: number) =>
    Math.round(minMs + seededUnit(seed, winkIndex) * (maxMs - minMs));
}

export function getOrganicWinkDelayMs(seed: number, winkIndex: number) {
  return createWinkSchedule(seed)(winkIndex);
}

export function getExpressionState(mode: EyeExpression, timeMs = 0) {
  const pulse = Math.sin(timeMs / 220) * 0.5 + 0.5;

  return {
    mode,
    pupilScale: mode === "sad" ? 0.85 : mode === "happy" ? 1.08 : 1,
    eyelidLift:
      mode === "sad" ? -0.25 : mode === "happy" ? 0.18 + pulse * 0.08 : 0,
    smile: mode === "happy",
    tear: mode === "sad",
  };
}
