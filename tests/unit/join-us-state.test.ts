import { describe, expect, it } from "vitest";
import {
  type JoinUsEvent,
  type JoinUsState,
  reduceJoinUsState,
} from "../../src/features/living-join-us/joinUsState";

const run = (state: JoinUsState, events: readonly JoinUsEvent[]) =>
  events.reduce(reduceJoinUsState, state);

describe("Living JOIN US state machine", () => {
  it.each([
    [
      "idle -> near -> idle",
      "idle",
      [{ type: "POINTER_NEAR" }, { type: "POINTER_AWAY" }],
      "idle",
    ],
    [
      "hover -> blush",
      "idle",
      [{ type: "RUBRICS_ENTER" }, { type: "RUBRICS_HOLD_3S" }],
      "rubricsBlush",
    ],
    [
      "hover -> click",
      "idle",
      [
        { type: "RUBRICS_ENTER" },
        { type: "RUBRICS_CLICK" },
        { type: "RUBRICS_LEAVE" },
      ],
      "rubricsClick",
    ],
    [
      "hover -> sad -> idle",
      "idle",
      [
        { type: "RUBRICS_ENTER" },
        { type: "RUBRICS_LEAVE" },
        { type: "SAD_DONE" },
      ],
      "idle",
    ],
  ] as const)("%s", (_name, start, events, expected) => {
    expect(run(start, events)).toBe(expected);
  });
});
