import * as React from "react";
import { materialConfigs, type MaterialKind } from "./materials.js";
import {
  applyPoke,
  createPokeModel,
  releasePoke,
  stepPoke,
  type PokeState,
} from "./poke.js";

export type MaterialPointerLike = {
  uv?: { x: number; y: number };
  pressure?: number;
  currentTarget?: { clientWidth?: number; clientHeight?: number };
  nativeEvent?: { offsetX?: number; offsetY?: number };
};

export type MaterialPokeOptions = {
  material: MaterialKind;
  onPoke?: (state: PokeState) => void;
};

export type PokeSurfaceProps = MaterialPokeOptions & {
  children?: React.ReactNode;
  underline?: boolean;
  logoTexture?: unknown;
};

export function getPointerUv(event: MaterialPointerLike) {
  if (event.uv) return { x: event.uv.x, y: event.uv.y };
  const width = event.currentTarget?.clientWidth || 1;
  const height = event.currentTarget?.clientHeight || 1;

  return {
    x: (event.nativeEvent?.offsetX ?? width / 2) / width,
    y: 1 - (event.nativeEvent?.offsetY ?? height / 2) / height,
  };
}

export function createMaterialPokeController(options: MaterialPokeOptions) {
  const state = createPokeModel();
  const config = materialConfigs[options.material];
  const update = (event: MaterialPointerLike, pressure = event.pressure ?? 0.25) => {
    const uv = getPointerUv(event);
    applyPoke(state, uv.x, uv.y, pressure * config.pressBoost);
    options.onPoke?.(state);
  };

  return {
    state,
    config,
    handlers: {
      onPointerMove: (event: MaterialPointerLike) => update(event),
      onPointerDown: (event: MaterialPointerLike) => update(event, 1),
      onPointerUp: () => releasePoke(state),
      onPointerOut: () => releasePoke(state),
    },
    step: (deltaMs = 16.67) => stepPoke(state, config, deltaMs),
  };
}

export function useMaterialPoke(options: MaterialPokeOptions) {
  return createMaterialPokeController(options);
}

export function PokeSurface({ children, ...options }: PokeSurfaceProps) {
  const controller = createMaterialPokeController(options);
  const props = {
    ...controller.handlers,
    "data-material": options.material,
    "data-underline": options.underline ? "true" : "false",
  };

  return React.createElement("mesh", props, children);
}

export function MaterialLogoSurface(props: PokeSurfaceProps) {
  return PokeSurface(props);
}
