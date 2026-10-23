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
