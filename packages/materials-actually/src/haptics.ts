import type { MaterialEventKind, MaterialKind } from "./materials.js";

export const materialHaptics: Record<
  MaterialKind,
  Partial<Record<MaterialEventKind, number[]>>
> = {
  glass: { contact: [8], fastSwipe: [4, 16, 4], wipe: [4, 16, 4], release: [3] },
  cloth: { press: [12], damage: [8, 20, 8] },
  rubber: { press: [18, 25, 18], damage: [5, 8, 5, 8, 5] },
  grass: { contact: [3, 10, 3], cut: [10] },
  mail: { contact: [10, 20, 10], press: [12, 18, 12] },
};

export type VibrationLike = {
  vibrate: (pattern: number | number[]) => boolean;
};

export type HapticOptions = {
  navigator?: VibrationLike;
  reducedMotion?: boolean;
};

export function shouldTriggerMaterialHaptic(
  lastAt: number,
  now: number,
  intervalMs = 180,
) {
  return now - lastAt > intervalMs;
}

export function getMaterialHapticPattern(
  material: MaterialKind,
  eventKind: MaterialEventKind,
  intensity = 1,
) {
  const pattern = materialHaptics[material][eventKind] ?? [];
  const scale = Math.max(0, Math.min(1, intensity));
  if (scale === 0) return [];
  return pattern.map((duration) => Math.max(1, Math.round(duration * scale)));
}

export function triggerMaterialHaptic(
  material: MaterialKind,
  eventKind: MaterialEventKind,
  intensity = 1,
  options: HapticOptions = {},
) {
  if (options.reducedMotion) return false;
  const vibrate = options.navigator?.vibrate;
  if (typeof vibrate !== "function") return false;
  const pattern = getMaterialHapticPattern(material, eventKind, intensity);
  if (pattern.length === 0) return false;
  try {
    return vibrate(pattern);
  } catch {
    return false;
  }
}
