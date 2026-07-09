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

export function constrainPupilOffset(
  pointerX: number,
  pointerY: number,
  bounds: { width: number; height: number },
) {
  const maxX = Math.max(0, bounds.width * 0.28);
  const maxY = Math.max(0, bounds.height * 0.24);
  const length = Math.hypot(pointerX, pointerY);
  const maxLength = Math.hypot(maxX, maxY);

  if (!length || length <= maxLength) {
    return {
      x: Math.max(-maxX, Math.min(maxX, pointerX)),
      y: Math.max(-maxY, Math.min(maxY, pointerY)),
    };
  }

  const scale = maxLength / length;
  return {
    x: Math.max(-maxX, Math.min(maxX, pointerX * scale)),
    y: Math.max(-maxY, Math.min(maxY, pointerY * scale)),
  };
}

export function isWithinHideRadius(
  pointer: { x: number; y: number },
  target: { x: number; y: number },
  radius: number,
) {
  return Math.hypot(pointer.x - target.x, pointer.y - target.y) <= radius;
}

export function getOrganicWinkDelayMs(seed: number, winkIndex: number) {
  const value =
    Math.sin((seed + 1) * 12.9898 + winkIndex * 78.233) * 43758.5453;
  const unit = value - Math.floor(value);

  return Math.round(2600 + unit * 3600);
}

export type EyeExpression = "idle" | "happy" | "sad";

export function getExpressionForJoinState(state: JoinUsState): EyeExpression {
  if (
    state === joinUsStates.rubricsHoverExcited ||
    state === joinUsStates.rubricsHoverBlush ||
    state === joinUsStates.rubricsClickCelebration
  ) {
    return "happy";
  }
  if (state === joinUsStates.sadShrivel) return "sad";
  return "idle";
}
