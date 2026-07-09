export type EyeBounds = {
  width: number;
  height: number;
};

export type PointerPoint = {
  x: number;
  y: number;
};

export type TargetBounds = PointerPoint & {
  width?: number;
  height?: number;
};

export function constrainPupilToEye(
  eyeBounds: EyeBounds,
  desired: PointerPoint,
  pupilRadius = 0,
) {
  const maxX = Math.max(0, eyeBounds.width * 0.28 - pupilRadius);
  const maxY = Math.max(0, eyeBounds.height * 0.24 - pupilRadius);
  const length = Math.hypot(desired.x, desired.y);
  const maxLength = Math.hypot(maxX, maxY);

  if (!length || length <= maxLength) {
    return {
      x: Math.max(-maxX, Math.min(maxX, desired.x)),
      y: Math.max(-maxY, Math.min(maxY, desired.y)),
    };
  }

  const scale = maxLength / length;

  return {
    x: Math.max(-maxX, Math.min(maxX, desired.x * scale)),
    y: Math.max(-maxY, Math.min(maxY, desired.y * scale)),
  };
}

export function constrainPupilOffset(
  pointerX: number,
  pointerY: number,
  bounds: EyeBounds,
) {
  return constrainPupilToEye(bounds, { x: pointerX, y: pointerY });
}

export function computePupilPosition(
  eyeBounds: EyeBounds,
  pointer: PointerPoint,
  options: { pupilRadius?: number; sensitivity?: number } = {},
) {
  const sensitivity = options.sensitivity ?? 0.035;

  return constrainPupilToEye(
    eyeBounds,
    { x: pointer.x * sensitivity, y: pointer.y * sensitivity },
    options.pupilRadius ?? 0,
  );
}

export function isInsideHideRadius(
  target: TargetBounds,
  pointer: PointerPoint,
  radius: number,
) {
  const centerX = target.x + (target.width ?? 0) / 2;
  const centerY = target.y + (target.height ?? 0) / 2;

  return Math.hypot(pointer.x - centerX, pointer.y - centerY) <= radius;
}

export function isWithinHideRadius(
  pointer: PointerPoint,
  target: PointerPoint,
  radius: number,
) {
  return isInsideHideRadius(target, pointer, radius);
}
