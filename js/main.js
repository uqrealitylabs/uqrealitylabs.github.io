import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

const CLEAR_COLOUR = 0x0f1118;
const CAM_FOV = 60;
const CAM_NEAR = 0.1;
const CAM_FAR = 2000;

// DEBUG = console logs for camera/model positions
const DEBUG = true;
// ENABLE_ORBIT_CONTROLS = manual camera movement and grid helper
const ENABLE_ORBIT_CONTROLS = false;
// ENABLE_LIGHT_DEBUG = visual helpers for light positions and directions
const ENABLE_LIGHT_DEBUG = false;

// lower factor = camera closer to model
const CAM_DISTANCE_FACTOR = 0.20;
const CAM_LEFT_FACTOR = 0.0;
const CAM_HEIGHT_FACTOR = 0.05;

const ASSET_BASE = import.meta.env.BASE_URL;
const MODEL_PATH = `${ASSET_BASE}Assets/test-two.glb`;

// tweak model placement in the scene
const MODEL_POS = { x: 0, y: 0, z: -200 };
const MODEL_ROTATION = { x: -20, y: 160, z: 180 }; // degrees
const MODEL_ENTRANCE_DURATION = 1.5;
const MODEL_ENTRANCE_EASE = "power3.out";
const MODEL_ENTRANCE_OFFSET_FACTOR = 200; // distance below final position (× model size)

const HOME_TITLE = "UQ Reality Labs est. 2022"
const HOME_DESCRIPTION = "Scroll down for more"

const ABOUT_TITLE = "About";
const ABOUT_DESCRIPTION = "UQ Reality Labs is Australia's first Augmented and Virtual Reality Club. \
 \nUQ Union Best Faculty Club (EAIT) 2024. \n UQ Union Best Small Club 2023. \n Join Us!";

const JOIN_LINK = "https://campus.hellorubric.com/?eid=39778"

const CONTACT_TITLE = "Contact";
const CONTACT_DESCRIPTION = "Here are some ways to get in touch with us";

const SPONSOR_TITLE = "Sponsors";
const SPONSOR_DESCRIPTION = "Here are some of the companies that support us";


// light offsets relative to model center (camera views from +Z)
const KEY_LIGHT_OFFSET = { x: 2, y: 10, z: 40 };
const FILL_LIGHT_OFFSET = { x: -12, y: 4, z: 25 };

const canvas = document.querySelector("#canvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR_COLOUR);

const camera = new THREE.PerspectiveCamera(
  CAM_FOV,
  window.innerWidth / window.innerHeight,
  CAM_NEAR,
  CAM_FAR
);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

let controls;
if (ENABLE_ORBIT_CONTROLS) {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.addEventListener("change", () =>
    logCameraPosition("Camera (OrbitControls)")
  );
}

if (ENABLE_ORBIT_CONTROLS) {
  const grid = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
  scene.add(grid);
}

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2a2f45, 0.95);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
scene.add(keyLight);
scene.add(keyLight.target);

const fillLight = new THREE.DirectionalLight(0xbfd2ff, 0.55);
scene.add(fillLight);
scene.add(fillLight.target);

const lightTarget = new THREE.Vector3();

const lightHelpers = [];
if (ENABLE_LIGHT_DEBUG) {
  lightHelpers.push(new THREE.HemisphereLightHelper(hemiLight, 5));
  lightHelpers.push(new THREE.DirectionalLightHelper(keyLight, 5, 0xffffff));
  lightHelpers.push(new THREE.DirectionalLightHelper(fillLight, 5, 0xbfd2ff));
  lightHelpers.forEach((helper) => scene.add(helper));
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const lookTarget = new THREE.Vector3();
let modelGroup = null;
let modelLookHeight = 0;
let cameraZ = 5;
let camLeftOffset = 0;
let camHeightOffset = 0;

function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

function logCameraPosition(context = "Camera") {
  if (!DEBUG) return;

  const { x, y, z } = camera.position;
  debugLog(`${context} position:`, { x, y, z });
}

function logModelPosition(context = "Model") {
  if (!DEBUG || !modelGroup) return;

  const { x, y, z } = modelGroup.position;
  const { x: rx, y: ry, z: rz } = modelGroup.rotation;
  debugLog(`${context} position:`, { x, y, z });
  debugLog(`${context} rotation (deg):`, {
    x: THREE.MathUtils.radToDeg(rx),
    y: THREE.MathUtils.radToDeg(ry),
    z: THREE.MathUtils.radToDeg(rz),
  });
}

function applyModelTransform() {
  if (!modelGroup) return;

  modelGroup.position.set(MODEL_POS.x, MODEL_POS.y, MODEL_POS.z);
  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x),
    THREE.MathUtils.degToRad(MODEL_ROTATION.y),
    THREE.MathUtils.degToRad(MODEL_ROTATION.z)
  );
}

function applyModelRotation() {
  if (!modelGroup) return;

  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x),
    THREE.MathUtils.degToRad(MODEL_ROTATION.y),
    THREE.MathUtils.degToRad(MODEL_ROTATION.z)
  );
}

function aimLightsAtModel() {
  const pos = modelGroup ? modelGroup.position : MODEL_POS;
  lightTarget.set(pos.x, pos.y + modelLookHeight, pos.z);

  hemiLight.position.set(lightTarget.x, lightTarget.y + 30, lightTarget.z);

  keyLight.position.set(
    lightTarget.x + KEY_LIGHT_OFFSET.x,
    lightTarget.y + KEY_LIGHT_OFFSET.y,
    lightTarget.z + KEY_LIGHT_OFFSET.z
  );
  keyLight.target.position.copy(lightTarget);

  fillLight.position.set(
    lightTarget.x + FILL_LIGHT_OFFSET.x,
    lightTarget.y + FILL_LIGHT_OFFSET.y,
    lightTarget.z + FILL_LIGHT_OFFSET.z
  );
  fillLight.target.position.copy(lightTarget);
}

function setCameraOnModel() {
  if (!modelGroup) return;

  camera.position.set(
    MODEL_POS.x - camLeftOffset,
    MODEL_POS.y + camHeightOffset,
    cameraZ
  );

  lookTarget.set(
    MODEL_POS.x,
    MODEL_POS.y + modelLookHeight,
    MODEL_POS.z
  );
  camera.lookAt(lookTarget);

  logCameraPosition("Camera (setCameraOnModel)");
}

function animateModelEntrance(modelSize) {
  if (!modelGroup) return;

  const finalY = MODEL_POS.y;
  const startY = finalY - modelSize * MODEL_ENTRANCE_OFFSET_FACTOR;
  const animPos = { y: startY };

  modelGroup.position.set(MODEL_POS.x, startY, MODEL_POS.z);

  gsap.to(animPos, {
    y: finalY,
    duration: MODEL_ENTRANCE_DURATION,
    ease: MODEL_ENTRANCE_EASE,
    onUpdate: () => {
      modelGroup.position.y = animPos.y;
      aimLightsAtModel();
    },
    onComplete: () => {
      modelGroup.position.set(MODEL_POS.x, MODEL_POS.y, MODEL_POS.z);
      aimLightsAtModel();
      logModelPosition("Model (entrance complete)");
    },
  });
}

loader.load(
  MODEL_PATH,
  (gltf) => {
    modelGroup = new THREE.Group();

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    modelGroup.add(gltf.scene);
    scene.add(modelGroup);

    applyModelRotation();

    modelLookHeight = size.y * 0.35;
    camLeftOffset = maxSize * CAM_LEFT_FACTOR;
    camHeightOffset = maxSize * CAM_HEIGHT_FACTOR;
    cameraZ = maxSize * CAM_DISTANCE_FACTOR;
    camera.near = Math.max(maxSize / 100, 0.01);
    camera.far = Math.max(maxSize * 100, CAM_FAR);
    camera.updateProjectionMatrix();

    setCameraOnModel();
    animateModelEntrance(maxSize);
    aimLightsAtModel();
    logModelPosition("Model (loaded)");
  },
  (xhr) => {
    if (DEBUG && xhr.lengthComputable) {
      const pct = ((xhr.loaded / xhr.total) * 100).toFixed(1);
      debugLog(`Loading model: ${pct}%`);
    }
  },
  (error) => {
    console.error("Failed to load GLB:", error);
  }
);

function onResize() {
  const { innerWidth, innerHeight } = window;

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);

  if (modelGroup && !ENABLE_ORBIT_CONTROLS) {
    lookTarget.copy(modelGroup.position);
    lookTarget.y += modelLookHeight;
    camera.lookAt(lookTarget);
  }

  if (ENABLE_ORBIT_CONTROLS && controls) {
    controls.update();
  }

  if (ENABLE_LIGHT_DEBUG) {
    lightHelpers.forEach((helper) => helper.update());
  }

  renderer.render(scene, camera);
}

animate();
