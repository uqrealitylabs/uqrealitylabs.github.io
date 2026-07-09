export const joinUsStates = {
  idleCurious: "idleCurious",
  joinNear: "joinNear",
  rubricsHoverExcited: "rubricsHoverExcited",
  rubricsHoverBlush: "rubricsHoverBlush",
  rubricsClickCelebration: "rubricsClickCelebration",
  sadShrivel: "sadShrivel",
  recoveringToIdle: "recoveringToIdle",
} as const;

export type JoinUsState = (typeof joinUsStates)[keyof typeof joinUsStates];
export type JoinUsEvent =
  | "pointerNear"
  | "pointerAway"
  | "rubricsHover"
  | "rubricsHoverElapsed"
  | "rubricsClick"
  | "rubricsLeave"
  | "recovered";

export const JOIN_US_BLUSH_DELAY_MS = 3000;
export const JOIN_US_NAVIGATION_DELAY_MS = 500;

export function shouldShowJoinBlush(hoverMs: number) {
  return hoverMs >= JOIN_US_BLUSH_DELAY_MS;
}

export function nextJoinUsState(
  current: JoinUsState,
  event: JoinUsEvent,
  hoverMs = 0,
): JoinUsState {
  if (event === "rubricsClick") return joinUsStates.rubricsClickCelebration;
  if (event === "rubricsLeave") return joinUsStates.sadShrivel;
  if (event === "recovered") return joinUsStates.idleCurious;
  if (event === "rubricsHover") return joinUsStates.rubricsHoverExcited;
  if (event === "rubricsHoverElapsed") {
    return shouldShowJoinBlush(hoverMs)
      ? joinUsStates.rubricsHoverBlush
      : current;
  }
  if (
    current !== joinUsStates.idleCurious &&
    current !== joinUsStates.joinNear
  ) {
    return current;
  }
  return event === "pointerNear"
    ? joinUsStates.joinNear
    : joinUsStates.idleCurious;
}
