import type { MaterialEventKind } from "./materials.js";
import type { PokePoint } from "./poke.js";

export type ContactPoint = PokePoint & {
  ageMs: number;
  strength: number;
  eventKind: MaterialEventKind;
};

export type ContactHistory = {
  points: ContactPoint[];
  maxPoints: number;
  fadeMs: number;
};

export function createContactHistory(
  options: { maxPoints?: number; fadeMs?: number } = {},
): ContactHistory {
  return {
    points: [],
    maxPoints: options.maxPoints ?? 8,
    fadeMs: options.fadeMs ?? 1400,
  };
}

export function addContact(
  history: ContactHistory,
  point: PokePoint,
  strength: number,
  eventKind: MaterialEventKind,
) {
  history.points.unshift({
    ...point,
    ageMs: 0,
    strength: Math.max(0, Math.min(1, strength)),
    eventKind,
  });
  history.points.length = Math.min(history.points.length, history.maxPoints);

  return history;
}

export function stepContactHistory(history: ContactHistory, deltaMs: number) {
  history.points.forEach((point) => {
    point.ageMs += Math.max(0, deltaMs);
  });
  history.points = history.points.filter((point) => point.ageMs < history.fadeMs);

  return history;
}
