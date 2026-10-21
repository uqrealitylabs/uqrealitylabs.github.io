export type Landmark = { x: number; y: number; z?: number };

/** Normalised geometry keeps gestures independent of camera resolution */
export function handGesture(points: Landmark[]) {
  if (
    points.length !== 21 ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    return undefined;
  const distance = (a: number, b: number) =>
    Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
  const palm = distance(0, 9);
  if (palm < 0.025) return undefined;
  const extended = [8, 12, 16, 20].map(
    (tip) => distance(tip, 0) > distance(tip - 2, 0) * 1.15,
  );
  const [index, middle, ring, pinky] = extended;
  const thumb = distance(4, 0) > distance(3, 0) * 1.12;
  const fist = !extended.some(Boolean);
  const sign = fist
    ? thumb
      ? points[4].y < points[2].y
        ? "thumb-up"
        : "thumb-down"
      : "fist"
    : index && middle && !ring && !pinky
      ? "peace"
      : index && !middle && !ring && pinky
        ? "rock"
        : extended.every(Boolean)
          ? "palm"
          : index && !middle && !ring && !pinky
            ? "point"
            : "";
  return {
    x: 1 - points[8].x,
    y: points[8].y,
    pinch: distance(4, 8) / palm < 0.28,
    scroll: extended[0] && extended[1] && !extended[2] && !extended[3],
    wave: extended.every(Boolean) && distance(4, 20) / palm > 1.1,
    sign,
    palm: { x: 1 - points[9].x, y: points[9].y },
    thumb: points[4],
    tip: points[8],
    size: palm,
  };
}

export function heartGesture(
  hands: NonNullable<ReturnType<typeof handGesture>>[],
) {
  if (hands.length !== 2) return false;
  const [a, b] = hands;
  const scale = (a.size + b.size) / 2;
  return (
    Math.hypot(a.thumb.x - b.thumb.x, a.thumb.y - b.thumb.y) < scale * 0.65 &&
    Math.hypot(a.tip.x - b.tip.x, a.tip.y - b.tip.y) < scale * 0.65 &&
    Math.hypot(a.tip.x - a.thumb.x, a.tip.y - a.thumb.y) > scale * 0.35
  );
}

/** Expression cues drive playful effects, rather than claiming to measure someone's mood */
export function faceExpression(scores: Record<string, number>) {
  const mean = (a: string, b: string) =>
    ((scores[a] ?? 0) + (scores[b] ?? 0)) / 2;
  if (mean("mouthSmileLeft", "mouthSmileRight") > 0.55)
    return (scores.jawOpen ?? 0) > 0.35 ? "laugh" : "smile";
  if ((scores.jawOpen ?? 0) > 0.55 && mean("eyeWideLeft", "eyeWideRight") > 0.3)
    return "surprise";
  if ((scores.mouthPucker ?? 0) > 0.65) return "kiss";
  if (mean("mouthFrownLeft", "mouthFrownRight") > 0.5) return "frown";
  if (mean("browDownLeft", "browDownRight") > 0.55) return "brow";
  if (mean("eyeSquintLeft", "eyeSquintRight") > 0.65) return "squint";
  if ((scores.browInnerUp ?? 0) > 0.65) return "curious";
  if ((scores.cheekPuff ?? 0) > 0.65) return "puff";
  return "neutral";
}

export type Pinch = { start: number; previous: number; dragged: boolean };
/** A pinch cannot click once it has become a drag, even if it returns to its starting point */
export function pinchAction(
  previous: Pinch | undefined,
  held: boolean,
  y: number,
) {
  if (!held)
    return {
      state: undefined,
      click: !!previous && !previous.dragged,
      scroll: 0,
    };
  if (!previous)
    return {
      state: { start: y, previous: y, dragged: false },
      click: false,
      scroll: 0,
    };
  const dragged = previous.dragged || Math.abs(y - previous.start) > 0.025;
  return {
    state: { ...previous, previous: y, dragged },
    click: false,
    scroll: dragged ? previous.previous - y : 0,
  };
}

/** Iris position is an approximate gaze cue, calibrated to the person's neutral look */
export function eyeGesture(points: Landmark[], blink: number[]) {
  if (points.length < 478) return undefined;
  const horizontal = ([a, b, iris]: number[]) =>
    (points[iris].x - points[a].x) / (points[b].x - points[a].x);
  const x = (horizontal([33, 133, 468]) + horizontal([362, 263, 473])) / 2;
  const vertical = ([a, b, iris]: number[]) =>
    (points[iris].y - points[a].y) / (points[b].y - points[a].y);
  const y = (vertical([159, 145, 468]) + vertical([386, 374, 473])) / 2;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y, wink: Math.max(...blink) > 0.65 && Math.min(...blink) < 0.3 };
}
