import { createStore } from "zustand/vanilla";

/** The scroll position and selected exhibit have one owner across the DOM and canvas */
export const worldState = createStore<{
  city: string;
  progress: number;
  selected: string;
  expression: string;
  steering: boolean;
  palm: { x: number; y: number; brake: boolean };
  reaction: string;
}>()(() => ({
  city: "",
  progress: 0,
  selected: "home",
  expression: "neutral",
  steering: false,
  palm: { x: 0, y: 0, brake: false },
  reaction: "",
}));
