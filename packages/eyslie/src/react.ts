import * as React from "react";
import {
  computePupilPosition,
  isInsideHideRadius,
  type EyeBounds,
  type PointerPoint,
  type TargetBounds,
} from "./eyeMath.js";
import {
  createWinkSchedule,
  getExpressionState,
  type EyeExpression,
} from "./state.js";

export type EyeShape = "o" | "u";

export type EyeProps = {
  shape?: EyeShape;
  color?: string;
  pupilColor?: string;
  label?: string;
  expression?: EyeExpression;
};

export type EyePairProps = EyeProps & {
  rightShape?: EyeShape;
};

export function getEyeAriaLabel(label = "tracking eyes") {
  return `${label} (decorative)`;
}

export function useEyeTracking(options: {
  eyeBounds: EyeBounds;
  pointer: PointerPoint;
  target?: TargetBounds;
  hideRadius?: number;
  pupilRadius?: number;
  reducedMotion?: boolean;
}) {
  const hidden =
    !!options.target &&
    !!options.hideRadius &&
    isInsideHideRadius(options.target, options.pointer, options.hideRadius);

  return {
    hidden,
    pupil:
      hidden || options.reducedMotion
        ? { x: 0, y: 0 }
        : computePupilPosition(options.eyeBounds, options.pointer, {
            pupilRadius: options.pupilRadius,
          }),
  };
}

export function useWink(options: {
  seed: number;
  index: number;
  reducedMotion?: boolean;
}) {
  if (options.reducedMotion) return Number.POSITIVE_INFINITY;

  return createWinkSchedule(options.seed)(options.index);
}

export function Eye({
  shape = "o",
  color = "currentColor",
  pupilColor = "#6b3f1f",
  label,
  expression = "idle",
}: EyeProps) {
  const state = getExpressionState(expression);
  const ringProps =
    shape === "u"
      ? { d: "M-5 -2 C-4 5 4 5 5 -2", fill: "none" }
      : { r: 5, fill: "#fff" };

  return React.createElement(
    "g",
    { "aria-label": getEyeAriaLabel(label), "data-expression": state.mode },
    React.createElement(shape === "u" ? "path" : "circle", {
      ...ringProps,
      stroke: color,
      strokeWidth: 2,
    }),
    React.createElement("circle", { r: 1.5 * state.pupilScale, fill: pupilColor }),
  );
}

export function EyePair({ rightShape = "u", ...props }: EyePairProps) {
  return React.createElement(
    "g",
    { role: "img", "aria-label": getEyeAriaLabel(props.label) },
    React.createElement(Eye, { ...props, shape: props.shape ?? "o" }),
    React.createElement(Eye, { ...props, shape: rightShape }),
  );
}
