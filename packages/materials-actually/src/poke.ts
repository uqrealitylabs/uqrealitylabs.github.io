import type { MaterialConfig, MaterialEventKind } from "./materials.js";

export type PokePoint = {
  x: number;
  y: number;
};

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

export type MaterialResponse = {
  deformation: number;
  smear: number;
  scratch: boolean;
  cut: boolean;
  resistance: number;
};

export type PokeEvent = {
  x: number;
  y: number;
  pressure?: number;
  active?: boolean;
};

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

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

export function createPokeModel() {
  return createPokeState();
}

export function computePointerVelocity(
  previous: PokePoint,
  next: PokePoint,
  deltaMs = 16.67,
) {
  const safeDelta = Math.max(1, deltaMs);
  const x = next.x - previous.x;
  const y = next.y - previous.y;
  const length = Math.hypot(x, y);

  return { x, y, length, perSecond: (length / safeDelta) * 1000 };
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

export function releasePoke(state: PokeState) {
  state.active = false;
  state.targetPressure = 0;
}

export function getPokeVelocity(state: PokeState) {
  return computePointerVelocity(
    { x: state.previousX, y: state.previousY },
    { x: state.x, y: state.y },
    16.67,
  );
}

export function stepPoke(
  state: PokeState,
  config: MaterialConfig,
  deltaMs = 16.67,
) {
  const velocity = getPokeVelocity(state);
  const decay = Math.pow(config.decay, Math.max(1, deltaMs) / 16.67);

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

  state.pressure += (state.targetPressure - state.pressure) * (1 - decay);
  state.stains *= config.kind === "glass" ? 0.985 : 0.94;
  if (!state.active) state.targetPressure = 0;
  state.active = false;
  state.previousX = state.x;
  state.previousY = state.y;

  if (state.pressure < 0.001 && state.targetPressure === 0) state.pressure = 0;
}

export function updatePokeModel(
  state: PokeState,
  config: MaterialConfig,
  event: PokeEvent | null,
  deltaMs = 16.67,
) {
  if (event) applyPoke(state, event.x, event.y, event.pressure);
  if (event?.active === false) releasePoke(state);
  stepPoke(state, config, deltaMs);

  return state;
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
    resistance: state.pressure * config.resistance,
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
  if (config.kind === "glass" && velocity.length > 0.22) return "fastSwipe";
  if (velocity.length >= config.damageVelocity) return "damage";
  if (pressure > 0.55) return "press";
  return pressure > 0.1 ? "contact" : "hover";
}
