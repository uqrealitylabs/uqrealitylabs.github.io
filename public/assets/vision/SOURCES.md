# Local vision assets

MediaPipe Tasks Vision, Apache-2.0
https://github.com/google-ai-edge/mediapipe
https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
https://developers.google.com/mediapipe/solutions/vision/face_landmarker

Versioned float16 models from Google's MediaPipe model repository
- https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The matching WASM runtime is copied from the locked npm dependency into `dist/assets/vision/wasm` at build time
Camera frames stay in a local worker and are not recorded, uploaded or persisted
Eye controls estimate gaze from iris landmarks and require personal calibration
Facial gestures are inputs, not evidence of mood or emotion
