import { expect, it } from "vitest";
import {
  eyeGesture,
  faceExpression,
  handGesture,
  heartGesture,
  pinchAction,
} from "../../src/input/gestures";

it("normalises hand pointing and pinch without accepting missing or tiny hands", () => {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  expect(handGesture([])).toBeUndefined();
  expect(handGesture(points)).toBeUndefined();
  points[9] = { x: 0.5, y: 0.3 };
  points[8] = { x: 0.25, y: 0.2 };
  points[4] = { x: 0.26, y: 0.2 };
  expect(handGesture(points)).toMatchObject({ x: 0.75, y: 0.2, pinch: true });
  points[4] = { x: 0.6, y: 0.4 };
  expect(handGesture(points)?.pinch).toBe(false);
});

it("arbitrates pinch release and scrolling without accidental clicks after a drag", () => {
  const press = pinchAction(undefined, true, 0.5);
  expect(pinchAction(press.state, false, 0.51).click).toBe(true);
  const drag = pinchAction(press.state, true, 0.6);
  expect(drag.scroll).toBeCloseTo(-0.1);
  const returned = pinchAction(drag.state, true, 0.5);
  expect(pinchAction(returned.state, false, 0.5).click).toBe(false);
  expect(pinchAction(undefined, false, 0.5).click).toBe(false);
});

it("requires two nearby hands for a heart and treats expression scores as visual cues", () => {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  points[9] = { x: 0.5, y: 0.3 };
  points[8] = { x: 0.48, y: 0.2 };
  points[4] = { x: 0.48, y: 0.35 };
  const a = handGesture(points)!;
  const b = { ...a, tip: { x: 0.52, y: 0.2 }, thumb: { x: 0.52, y: 0.35 } };
  expect(heartGesture([a])).toBe(false);
  expect(heartGesture([a, b])).toBe(true);
  expect(heartGesture([a, { ...b, tip: { x: 0.9, y: 0.2 } }])).toBe(false);
  expect(faceExpression({})).toBe("neutral");
  expect(
    faceExpression({ mouthSmileLeft: 0.9, mouthSmileRight: 0.8, jawOpen: 0.6 }),
  ).toBe("laugh");
  expect(faceExpression({ mouthPucker: 0.9 })).toBe("kiss");
});

it("rejects degenerate gaze and distinguishes a deliberate wink from an ordinary blink", () => {
  expect(eyeGesture([], [])).toBeUndefined();
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  expect(eyeGesture(points, [0, 0])).toBeUndefined();
  for (const i of [33, 362]) points[i].x = 0.4;
  for (const i of [133, 263]) points[i].x = 0.6;
  for (const i of [159, 386]) points[i].y = 0.4;
  for (const i of [145, 374]) points[i].y = 0.6;
  expect(eyeGesture(points, [0.9, 0.1])).toMatchObject({
    x: 0.5,
    y: 0.5,
    wink: true,
  });
  expect(eyeGesture(points, [0.9, 0.9])?.wink).toBe(false);
});
