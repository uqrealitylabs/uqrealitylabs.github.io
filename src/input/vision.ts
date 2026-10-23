import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import {
  eyeGesture,
  faceExpression,
  handGesture,
  heartGesture,
} from "./gestures";

let hands: HandLandmarker | undefined;
let face: FaceLandmarker | undefined;
self.onmessage = async ({
  data,
}: MessageEvent<{
  start?: boolean;
  frame?: ImageBitmap;
  time: number;
}>) => {
  try {
    if (data.start) {
      hands?.close();
      face?.close();
      const files = await FilesetResolver.forVisionTasks("/assets/vision/wasm");
      const options = {
        baseOptions: {
          delegate: "CPU" as const,
        },
        runningMode: "VIDEO" as const,
      };
      [hands, face] = await Promise.all([
        HandLandmarker.createFromOptions(files, {
          ...options,
          baseOptions: {
            ...options.baseOptions,
            modelAssetPath: "/assets/vision/hand.task",
          },
          numHands: 2,
        }),
        FaceLandmarker.createFromOptions(files, {
          ...options,
          baseOptions: {
            ...options.baseOptions,
            modelAssetPath: "/assets/vision/face.task",
          },
          numFaces: 1,
          outputFaceBlendshapes: true,
        }),
      ]);
      self.postMessage({ ready: true });
    } else if (data.frame && hands && face) {
      const result = face.detectForVideo(data.frame, data.time);
      const detected = hands
        .detectForVideo(data.frame, data.time)
        .landmarks.map(handGesture)
        .filter((h) => h !== undefined);
      const categories = result.faceBlendshapes[0]?.categories ?? [];
      self.postMessage({
        hands: detected,
        heart: heartGesture(detected),
        expression: faceExpression(
          Object.fromEntries(categories.map((c) => [c.categoryName, c.score])),
        ),
        eye:
          eyeGesture(result.faceLandmarks[0] ?? [], [
            categories.find((c) => c.categoryName === "eyeBlinkLeft")?.score ??
              0,
            categories.find((c) => c.categoryName === "eyeBlinkRight")?.score ??
              0,
          ]) ?? null,
      });
    }
  } catch (error) {
    self.postMessage({ error: String(error) });
  } finally {
    data.frame?.close();
  }
};
