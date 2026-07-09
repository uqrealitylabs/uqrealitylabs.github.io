import type { SocialMaterialConfig } from "./materialConfig";

export type PokeState = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  pressure: number;
  targetPressure: number;
  active: boolean;
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
  };
}

export function applyPoke(
  state: PokeState,
  x: number,
  y: number,
  pressure = 0.25,
) {
  state.previousX = state.x;
  state.previousY = state.y;
  state.x = Math.max(0, Math.min(1, x));
  state.y = Math.max(0, Math.min(1, y));
  state.targetPressure = Math.max(0.1, Math.min(1, pressure));
  state.active = true;
}

export function stepPoke(state: PokeState, config: SocialMaterialConfig) {
  state.pressure +=
    (state.targetPressure - state.pressure) * (1 - config.decay);
  if (!state.active) state.targetPressure = 0;
  state.active = false;

  if (state.pressure < 0.001 && state.targetPressure === 0) {
    state.pressure = 0;
  }
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

export function getPokeVelocity(state: PokeState) {
  return {
    x: state.x - state.previousX,
    y: state.y - state.previousY,
    length: Math.hypot(state.x - state.previousX, state.y - state.previousY),
  };
}
