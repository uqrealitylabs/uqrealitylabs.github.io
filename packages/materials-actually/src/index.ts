export type MaterialKind = "cloth" | "rubber" | "glass" | "grass" | "mail";
export type MaterialBehavior = "crease" | "squish" | "smudge" | "bend";
export type MaterialEventKind =
  | "contact"
  | "press"
  | "fastSwipe"
  | "damage"
  | "cut"
  | "release";

export type MaterialConfig = {
  kind: MaterialKind;
  behavior: MaterialBehavior;
  pointerResponse: true;
  pressBoost: number;
  decay: number;
  deformation: number;
  smear: number;
  damageVelocity: number;
  cutVelocity: number;
};

export type MaterialResponse = {
  deformation: number;
  smear: number;
  scratch: boolean;
  cut: boolean;
};

export const materialConfigs: Record<MaterialKind, MaterialConfig> = {
  cloth: {
    kind: "cloth",
    behavior: "crease",
    pointerResponse: true,
    pressBoost: 1.4,
    decay: 0.86,
    deformation: 0.7,
    smear: 0.1,
    damageVelocity: 0.42,
    cutVelocity: Number.POSITIVE_INFINITY,
  },
  rubber: {
    kind: "rubber",
    behavior: "squish",
    pointerResponse: true,
    pressBoost: 1.75,
    decay: 0.78,
    deformation: 1,
    smear: 0.05,
    damageVelocity: 0.36,
    cutVelocity: Number.POSITIVE_INFINITY,
  },
  glass: {
    kind: "glass",
    behavior: "smudge",
    pointerResponse: true,
    pressBoost: 1.15,
    decay: 0.94,
    deformation: 0,
    smear: 1,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: Number.POSITIVE_INFINITY,
  },
  grass: {
    kind: "grass",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.55,
    decay: 0.82,
    deformation: 0.55,
    smear: 0,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: 0.32,
  },
  mail: {
    kind: "mail",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.35,
    decay: 0.84,
    deformation: 0.38,
    smear: 0.12,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: Number.POSITIVE_INFINITY,
  },
};

export function getMaterialKind(label = ""): MaterialKind {
  const name = label.toLowerCase();

  if (Object.hasOwn(materialConfigs, name)) return name as MaterialKind;
  if (name.includes("discord")) return "rubber";
  if (name.includes("linkedin")) return "glass";
  if (name.includes("email") || name.includes("mail")) return "mail";
  if (name.includes("grass")) return "grass";
  return "cloth";
}

export function getMaterialConfig(label = "") {
  return materialConfigs[getMaterialKind(label)];
}

export type PokeState = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  pressure: number;
  targetPressure: number;
  active: boolean;
  stains: number;
  scratches: number;
  cuts: number;
};

export function createPokeState(): PokeState {
  return {
    x: 0.5,
    y: 0.5,
    previousX: 0.5,
    previousY: 0.5,
    pressure: 0,
    targetPressure: 0,
    active: false,
    stains: 0,
    scratches: 0,
    cuts: 0,
  };
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function applyPoke(
  state: PokeState,
  x: number,
  y: number,
  pressure = 0.25,
) {
  state.previousX = state.x;
  state.previousY = state.y;
  state.x = clamp01(x);
  state.y = clamp01(y);
  state.targetPressure = Math.max(0.1, clamp01(pressure));
  state.active = true;
}

export function getPokeVelocity(state: PokeState) {
  const x = state.x - state.previousX;
  const y = state.y - state.previousY;
  return { x, y, length: Math.hypot(x, y) };
}

export function stepPoke(state: PokeState, config: MaterialConfig) {
  const velocity = getPokeVelocity(state);

  if (config.kind === "glass" && state.active) {
    state.stains = clamp01(state.stains + state.targetPressure * 0.18);
    state.stains = clamp01(state.stains + velocity.length * config.smear);
  }
  if (
    state.active &&
    (config.kind === "rubber" || config.kind === "cloth") &&
    velocity.length >= config.damageVelocity
  ) {
    state.scratches += 1;
  }
  if (
    state.active &&
    config.kind === "grass" &&
    velocity.length >= config.cutVelocity
  ) {
    state.cuts += Math.max(1, Math.round(velocity.length * 8));
  }

  state.pressure +=
    (state.targetPressure - state.pressure) * (1 - config.decay);
  state.stains *= config.kind === "glass" ? 0.985 : 0.94;
  if (!state.active) state.targetPressure = 0;
  state.active = false;
  state.previousX = state.x;
  state.previousY = state.y;

  if (state.pressure < 0.001 && state.targetPressure === 0) state.pressure = 0;
}

export function getPokeInfluence(
  state: PokeState,
  x: number,
  y: number,
  radius = 0.26,
) {
  const distance = Math.hypot(x - state.x, y - state.y);
  return Math.max(0, 1 - distance / radius) * state.pressure;
}

export function getMaterialResponse(
  config: MaterialConfig,
  state: PokeState,
): MaterialResponse {
  return {
    deformation: state.pressure * config.deformation,
    smear: config.kind === "glass" ? state.stains : 0,
    scratch: state.scratches > 0,
    cut: state.cuts > 0,
  };
}

export function getMaterialEventKind(
  config: MaterialConfig,
  state: PokeState,
  pressure: number,
): MaterialEventKind {
  const velocity = getPokeVelocity(state);

  if (config.kind === "grass" && velocity.length >= config.cutVelocity) {
    return "cut";
  }
  if (velocity.length >= config.damageVelocity) return "damage";
  if (config.kind === "glass" && velocity.length > 0.22) return "fastSwipe";
  if (pressure > 0.55) return "press";
  return "contact";
}

export function shouldTriggerMaterialHaptic(
  lastAt: number,
  now: number,
  intervalMs = 180,
) {
  return now - lastAt > intervalMs;
}

export const materialHaptics: Record<
  MaterialKind,
  Partial<Record<MaterialEventKind, number[]>>
> = {
  glass: { contact: [8], fastSwipe: [4, 16, 4], release: [3] },
  cloth: { press: [12], damage: [8, 20, 8] },
  rubber: { press: [18, 25, 18], damage: [5, 8, 5, 8, 5] },
  grass: { contact: [3, 10, 3], cut: [10] },
  mail: { contact: [10, 20, 10], press: [12, 18, 12] },
};

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
  options: {
    navigator?: Pick<Navigator, "vibrate">;
    reducedMotion?: boolean;
  } = {},
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
