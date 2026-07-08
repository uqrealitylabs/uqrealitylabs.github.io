export type JoinUsState =
  | "idle"
  | "near"
  | "rubricsHover"
  | "rubricsBlush"
  | "rubricsClick"
  | "sad";

export type JoinUsEvent =
  | { type: "POINTER_NEAR" }
  | { type: "POINTER_AWAY" }
  | { type: "RUBRICS_ENTER" }
  | { type: "RUBRICS_HOLD_3S" }
  | { type: "RUBRICS_CLICK" }
  | { type: "RUBRICS_LEAVE" }
  | { type: "SAD_DONE" };

export function reduceJoinUsState(
  state: JoinUsState,
  event: JoinUsEvent,
): JoinUsState {
  if (state === "rubricsClick") return state;

  switch (event.type) {
    case "RUBRICS_CLICK":
      return "rubricsClick";
    case "RUBRICS_ENTER":
      return "rubricsHover";
    case "RUBRICS_HOLD_3S":
      return state === "rubricsHover" ? "rubricsBlush" : state;
    case "RUBRICS_LEAVE":
      return state === "rubricsHover" || state === "rubricsBlush"
        ? "sad"
        : state;
    case "SAD_DONE":
      return "idle";
    case "POINTER_NEAR":
      return state === "idle" ? "near" : state;
    case "POINTER_AWAY":
      return state === "near" ? "idle" : state;
  }
}
