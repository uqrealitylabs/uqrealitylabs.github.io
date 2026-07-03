import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { Observer } from "gsap/all";
import { Text } from "troika-three-text";

gsap.registerPlugin(Observer);

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

const SCROLL_DURATION = 1;
const SCROLL_TOLERANCE = 30;
const STAR_COUNT = 200;
const STAR_DRIFT_DISTANCE = 200;
const SECTION_Y_STEP = 200;
const TEXT_FONT_SIZE = 2;
const TEXT_MAX_WIDTH = 40;
const TEXT_REVEAL_DURATION = 1;
const TEXT_HIDE_DURATION = 1;

const ASSET_BASE = import.meta.env.BASE_URL;
//const TITLE_FONT = `${ASSET_BASE}Assets/fonts/PixelifySans/static/PixelifySans-Regular.ttf`;
const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Medium.ttf`;
//const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Rubik_Glitch/RubikGlitch-Regular.ttf`;
const MODEL_PATH = `${ASSET_BASE}Assets/test-two.glb`;
const LABS_LOGO_PATH = `${ASSET_BASE}Assets/images/labs_logo.png`;

const HOME_TITLE = "UQ Reality Labs est. 2022";
const HOME_DESCRIPTION = "Scroll down for more";

const ABOUT_TITLE = "About";
const ABOUT_DESCRIPTION = "UQ Reality Labs is Australia's first Augmented and Virtual Reality Club. \
 \nUQ Union Best Faculty Club (EAIT) 2024. \n UQ Union Best Small Club 2023. \n Join Us!";

const JOIN_LINK = "https://campus.hellorubric.com/?eid=39778";

const CONTACT_TITLE = "Contact";
const CONTACT_DESCRIPTION = "Here are some ways to get in touch with us";

const SPONSOR_TITLE = "Sponsors";
const SPONSOR_DESCRIPTION = "Here are some of the companies that support us";

const COMMITTEE_TITLE = "Committee";
const COMMITTEE_DESCRIPTION = "Meet the UQ Reality Labs committee.";

const CYRUS_LINK = "https://www.linkedin.com/in/cyrus-forudi/";
const RADHESH_LINK = "https://www.linkedin.com/in/radhesh-g/"
const CLARE_LINK = "https://www.linkedin.com/in/clare-johnston-koto/"
const DORIS_LINK = "https://www.linkedin.com/in/doriswei/"
const NAVYA_LINK = "https://www.linkedin.com/in/navpas/"
const AMNA_LINK = "https://www.linkedin.com/in/amna-ar/"

// scroll down moves to the next section (model shifts down on Y)
const MODEL_SECTIONS = [
  { x: 0, y: 0, z: -20, label: "Home" },
  { x: 0, y: -SECTION_Y_STEP, z: -20, label: "About" },
  { x: 0, y: -SECTION_Y_STEP * 2, z: -20, label: "Contact" },
  { x: 0, y: -SECTION_Y_STEP * 3, z: -20, label: "Sponsors" },
  { x: 0, y: -SECTION_Y_STEP * 4, z: -20, label: "Committee" },
];

// these are relative to the camera
const TEXT_SECTIONS = [
  { x: -15, y: 10, z: -20, text: HOME_TITLE },
  { x: -10, y: 10, z: -20, text: ABOUT_TITLE },
  { x: -10, y: 10, z: -20, text: CONTACT_TITLE },
  { x: -10, y: 10, z: -20, text: SPONSOR_TITLE },
  { x: -10, y: 10, z: -20, text: COMMITTEE_TITLE },
];

const MODEL_SCALE = 0.10;
const MODEL_ROTATION = { x: -20, y: 160, z: 180 }; // degrees
const MODEL_ENTRANCE_DURATION = 1.5;
const MODEL_ENTRANCE_EASE = "power3.out";
const MODEL_ENTRANCE_OFFSET_FACTOR = 200; // distance below final position (× model size)

// light offsets relative to model center (camera views from +Z)
const KEY_LIGHT_OFFSET = { x: 2, y: 10, z: 40 };
const FILL_LIGHT_OFFSET = { x: -12, y: 4, z: 25 };
const RAINBOW_Z_OFFSET = -80; // behind model (home model z -20 → light z -100)
const RAINBOW_FADE_DURATION = 0.6;
const RAINBOW_GLOW_SCALE = 14;
const RAINBOW_OUTER_GLOW_SCALE = 22;
const RAINBOW_LIGHT_INTENSITY = 1.5;
const RAINBOW_LIGHT_DISTANCE = 40;
const RAINBOW_LIGHT_DECAY = 0.75;

const canvas = document.querySelector("#canvas");
const statusLabel = document.querySelector("#status");
const navLogoImage = document.querySelector("#nav-logo-img");
const navSectionButtons = document.querySelectorAll("#navbar [data-section]");

if (DEBUG && statusLabel) {
  statusLabel.hidden = false;
  statusLabel.textContent = "Loading…";
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR_COLOUR);

const stars = [];

function generateStars() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);
  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(800));

  star.position.set(x, y, z);
  scene.add(star);
  stars.push(star);
}

function animateStarsOnTransition() {
  stars.forEach((star) => {
    gsap.killTweensOf(star.position);
    gsap.to(star.position, {
      x: star.position.x + THREE.MathUtils.randFloatSpread(STAR_DRIFT_DISTANCE),
      y: star.position.y + THREE.MathUtils.randFloatSpread(STAR_DRIFT_DISTANCE),
      z: star.position.z + THREE.MathUtils.randFloatSpread(STAR_DRIFT_DISTANCE),
      duration: SCROLL_DURATION,
      ease: "power2.inOut",
    });
  });
}

Array(STAR_COUNT)
  .fill()
  .forEach(generateStars);

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
let currentIndex = 0;
let isAnimating = false;
let entranceComplete = false;
let sectionTexts = [];
let rainbowBackdrop = null;
let rainbowHue = 0;

function getSectionPos(index = currentIndex) {
  return MODEL_SECTIONS[index];
}

function getCurrentSectionPos() {
  return getSectionPos(currentIndex);
}

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

  const pos = getCurrentSectionPos();
  modelGroup.position.set(pos.x, pos.y, pos.z);
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
  const pos = modelGroup ? modelGroup.position : getCurrentSectionPos();
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

  updateRainbowBackdropPosition();
}

function createRainbowGlowTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const center = size / 2;
  const gradient = ctx.createRadialGradient(
    center,
    center,
    center * 0.05,
    center,
    center,
    center
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(0.2, "rgba(255, 80, 180, 0.42)");
  gradient.addColorStop(0.4, "rgba(255, 60, 60, 0.32)");
  gradient.addColorStop(0.55, "rgba(255, 200, 60, 0.24)");
  gradient.addColorStop(0.7, "rgba(80, 220, 120, 0.16)");
  gradient.addColorStop(0.85, "rgba(80, 140, 255, 0.08)");
  gradient.addColorStop(1, "rgba(160, 80, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRainbowGlowMaterial(texture, opacity) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createRainbowBackdrop(maxSize) {
  const group = new THREE.Group();
  const texture = createRainbowGlowTexture();
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const innerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(maxSize * RAINBOW_GLOW_SCALE, maxSize * RAINBOW_GLOW_SCALE),
    createRainbowGlowMaterial(texture, 0.7)
  );
  group.add(innerGlow);

  const outerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      maxSize * RAINBOW_OUTER_GLOW_SCALE,
      maxSize * RAINBOW_OUTER_GLOW_SCALE
    ),
    createRainbowGlowMaterial(texture, 0.35)
  );
  group.add(outerGlow);

  const pointLight = new THREE.PointLight(
    0xffffff,
    RAINBOW_LIGHT_INTENSITY,
    maxSize * RAINBOW_LIGHT_DISTANCE
  );
  pointLight.decay = RAINBOW_LIGHT_DECAY;
  group.add(pointLight);

  group.userData.glowMeshes = [innerGlow, outerGlow];
  group.userData.glowOpacities = [0.7, 0.35];
  group.userData.pointLight = pointLight;
  group.visible = false;

  for (const mesh of group.userData.glowMeshes) {
    mesh.material.opacity = 0;
  }
  pointLight.intensity = 0;

  scene.add(group);
  return group;
}

function updateRainbowBackdropPosition() {
  if (!rainbowBackdrop || !modelGroup) return;

  const pos = modelGroup.position;
  rainbowBackdrop.position.set(
    pos.x,
    pos.y + modelLookHeight,
    pos.z + RAINBOW_Z_OFFSET
  );
}

function updateRainbowBackdropRotation() {
  if (!rainbowBackdrop?.visible) return;

  rainbowBackdrop.lookAt(camera.position);
}

function stopRainbowFade() {
  if (!rainbowBackdrop) return;

  for (const mesh of rainbowBackdrop.userData.glowMeshes) {
    gsap.killTweensOf(mesh.material);
  }
  gsap.killTweensOf(rainbowBackdrop.userData.pointLight);
}

function setRainbowBackdropVisible(visible) {
  if (!rainbowBackdrop) return Promise.resolve();

  stopRainbowFade();

  const { glowMeshes, glowOpacities, pointLight } = rainbowBackdrop.userData;
  const targetIntensity = visible ? RAINBOW_LIGHT_INTENSITY : 0;

  rainbowBackdrop.visible = true;

  return new Promise((resolve) => {
    glowMeshes.forEach((mesh, index) => {
      gsap.to(mesh.material, {
        opacity: visible ? glowOpacities[index] : 0,
        duration: RAINBOW_FADE_DURATION,
        ease: visible ? "power2.out" : "power2.in",
      });
    });

    gsap.to(pointLight, {
      intensity: targetIntensity,
      duration: RAINBOW_FADE_DURATION,
      ease: visible ? "power2.out" : "power2.in",
      onComplete: () => {
        if (!visible) {
          rainbowBackdrop.visible = false;
        }
        resolve();
      },
    });
  });
}

function hideRainbowBackdrop() {
  return setRainbowBackdropVisible(false);
}

function showRainbowBackdrop() {
  updateRainbowBackdropPosition();
  updateRainbowBackdropRotation();
  return setRainbowBackdropVisible(true);
}

function animateRainbowBackdrop() {
  if (!rainbowBackdrop?.visible) return;

  rainbowHue = (rainbowHue + 0.003) % 1;
  rainbowBackdrop.userData.pointLight.color.setHSL(rainbowHue, 1, 0.55);
  updateRainbowBackdropRotation();
}

function setCameraOnModel(sectionPos = getCurrentSectionPos()) {
  if (!modelGroup) return;

  camera.position.set(
    sectionPos.x - camLeftOffset,
    sectionPos.y + camHeightOffset,
    cameraZ
  );

  lookTarget.set(
    sectionPos.x,
    sectionPos.y + modelLookHeight,
    sectionPos.z
  );
  camera.lookAt(lookTarget);

  logCameraPosition("Camera (setCameraOnModel)");
}

function updateStatus() {
  const section = getCurrentSectionPos();
  const text = `${section.label} (${currentIndex + 1}/${MODEL_SECTIONS.length})`;

  debugLog(text);

  if (DEBUG && statusLabel) {
    statusLabel.textContent = text;
  }

  updateNavbarActive();
}

function updateNavbarActive() {
  navSectionButtons.forEach((button) => {
    const sectionIndex = Number(button.dataset.section);
    button.classList.toggle("is-active", sectionIndex === currentIndex);
  });
}

function goToSection(index) {
  if (!modelGroup || isAnimating || !entranceComplete) return;
  if (index < 0 || index >= MODEL_SECTIONS.length) return;

  transitionToSection(index);
}

function setupNavbar() {
  if (navLogoImage) {
    navLogoImage.src = LABS_LOGO_PATH;
  }

  navSectionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      goToSection(Number(button.dataset.section));
    });
  });

  updateNavbarActive();
}

function setTextByLength(textMesh, length) {
  const full = textMesh.userData.fullText;
  textMesh.text = full.slice(0, Math.max(0, Math.min(length, full.length)));
  textMesh.sync();
}

function stopTextAnimation(textMesh) {
  if (textMesh.userData.textTween) {
    textMesh.userData.textTween.kill();
    textMesh.userData.textTween = null;
  }
}

function revealTextMesh(textMesh) {
  if (!textMesh) return Promise.resolve();

  stopTextAnimation(textMesh);

  const full = textMesh.userData.fullText;
  textMesh.visible = true;
  setTextByLength(textMesh, 0);

  const state = { length: 0 };

  return new Promise((resolve) => {
    textMesh.userData.textTween = gsap.to(state, {
      length: full.length,
      duration: TEXT_REVEAL_DURATION,
      ease: "none",
      onUpdate: () => setTextByLength(textMesh, Math.floor(state.length)),
      onComplete: () => {
        setTextByLength(textMesh, full.length);
        textMesh.userData.textTween = null;
        resolve();
      },
    });
  });
}

function hideTextMesh(textMesh, duration = TEXT_HIDE_DURATION) {
  if (!textMesh) return Promise.resolve();

  stopTextAnimation(textMesh);

  const full = textMesh.userData.fullText;
  const state = { length: full.length };
  setTextByLength(textMesh, full.length);

  return new Promise((resolve) => {
    textMesh.userData.textTween = gsap.to(state, {
      length: 0,
      duration,
      ease: "none",
      onUpdate: () => setTextByLength(textMesh, Math.ceil(state.length)),
      onComplete: () => {
        setTextByLength(textMesh, 0);
        textMesh.visible = false;
        textMesh.userData.textTween = null;
        resolve();
      },
    });
  });
}

function revealSectionText(index) {
  return revealTextMesh(sectionTexts[index]);
}

function hideSectionText(index) {
  return hideTextMesh(sectionTexts[index]);
}

function createSectionText(section) {
  const outText = new Text();

  outText.userData.fullText = section.text;
  outText.text = "";
  outText.font = TITLE_FONT;
  outText.fontSize = TEXT_FONT_SIZE;
  outText.color = 0xffffff;
  outText.maxWidth = TEXT_MAX_WIDTH;
  outText.position.set(section.x, section.y, section.z);
  outText.textAlign = "left";
  outText.anchorX = "left";
  outText.anchorY = "middle";
  outText.visible = false;
  outText.sync();

  scene.add(outText);
  return outText;
}

function initSectionTexts() {
  sectionTexts = TEXT_SECTIONS.map((section) => createSectionText(section));
}

function warmupSectionTexts() {
  return Promise.all(
    sectionTexts.map(
      (textMesh) =>
        new Promise((resolve) => {
          textMesh.text = textMesh.userData.fullText;
          textMesh.sync(() => {
            textMesh.text = "";
            textMesh.visible = false;
            textMesh.sync(resolve);
          });
        })
    )
  );
}

async function transitionToSection(newIndex) {
  if (!modelGroup || isAnimating || newIndex === currentIndex) return;
  if (newIndex < 0 || newIndex >= MODEL_SECTIONS.length) return;

  isAnimating = true;
  const oldIndex = currentIndex;

  await hideSectionText(oldIndex);

  if (oldIndex === 0) {
    await hideRainbowBackdrop();
  }

  currentIndex = newIndex;
  updateStatus();

  const targetPos = getCurrentSectionPos();
  animateStarsOnTransition();
  const anim = {
    x: modelGroup.position.x,
    y: modelGroup.position.y,
    z: modelGroup.position.z,
  };

  await new Promise((resolve) => {
    gsap.to(anim, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: SCROLL_DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        modelGroup.position.set(anim.x, anim.y, anim.z);
        aimLightsAtModel();
      },
      onComplete: () => {
        modelGroup.position.set(targetPos.x, targetPos.y, targetPos.z);
        aimLightsAtModel();
        resolve();
      },
    });
  });

  await revealSectionText(currentIndex);

  if (currentIndex === 0) {
    await showRainbowBackdrop();
  }

  isAnimating = false;
}

function goToNextSection() {
  if (
    !modelGroup ||
    isAnimating ||
    !entranceComplete ||
    currentIndex >= MODEL_SECTIONS.length - 1
  ) {
    return;
  }

  transitionToSection(currentIndex + 1);
}

function goToPrevSection() {
  if (!modelGroup || isAnimating || !entranceComplete || currentIndex <= 0) {
    return;
  }

  transitionToSection(currentIndex - 1);
}

function setupScrollControl() {
  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    onDown: () => goToNextSection(),
    onUp: () => goToPrevSection(),
    tolerance: SCROLL_TOLERANCE,
  });
}

setupScrollControl();
initSectionTexts();
setupNavbar();

function animateModelEntrance(modelSize) {
  if (!modelGroup) return;

  const homePos = getSectionPos(0);
  const finalY = homePos.y;
  const startY = finalY - modelSize * MODEL_ENTRANCE_OFFSET_FACTOR;
  const animPos = { y: startY };

  isAnimating = true;
  modelGroup.position.set(homePos.x, startY, homePos.z);

  gsap.to(animPos, {
    y: finalY,
    duration: MODEL_ENTRANCE_DURATION,
    ease: MODEL_ENTRANCE_EASE,
    onUpdate: () => {
      modelGroup.position.y = animPos.y;
      aimLightsAtModel();
    },
    onComplete: async () => {
      modelGroup.position.set(homePos.x, homePos.y, homePos.z);
      aimLightsAtModel();
      isAnimating = false;
      entranceComplete = true;
      updateStatus();
      await revealSectionText(0);
      await showRainbowBackdrop();
      logModelPosition("Model (entrance complete)");
    },
  });
}

loader.load(
  MODEL_PATH,
  (gltf) => {
    modelGroup = new THREE.Group();

    modelGroup.add(gltf.scene);
    modelGroup.scale.setScalar(MODEL_SCALE);
    scene.add(modelGroup);

    applyModelRotation();

    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    modelLookHeight = size.y * 0.35;
    camLeftOffset = maxSize * CAM_LEFT_FACTOR;
    camHeightOffset = maxSize * CAM_HEIGHT_FACTOR;
    cameraZ = maxSize * CAM_DISTANCE_FACTOR;
    camera.near = Math.max(maxSize / 100, 0.01);
    camera.far = Math.max(maxSize * 100, CAM_FAR);
    camera.updateProjectionMatrix();

    rainbowBackdrop = createRainbowBackdrop(maxSize);

    warmupSectionTexts().then(() => {
      setCameraOnModel(getSectionPos(0));
      animateModelEntrance(maxSize);
      aimLightsAtModel();
      updateStatus();
      logModelPosition("Model (loaded)");
    });
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

  animateRainbowBackdrop();

  if (ENABLE_ORBIT_CONTROLS && controls) {
    controls.update();
  }

  if (ENABLE_LIGHT_DEBUG) {
    lightHelpers.forEach((helper) => helper.update());
  }

  renderer.render(scene, camera);
}

animate();
