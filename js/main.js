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
const DEBUG = false;
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
const DESCRIPTION_Y_OFFSET = -5;
const DESCRIPTION_FONT_SIZE = 1.25;

const ASSET_BASE = import.meta.env.BASE_URL;
//const TITLE_FONT = `${ASSET_BASE}Assets/fonts/PixelifySans/static/PixelifySans-Regular.ttf`;
const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Medium.ttf`;
const DESCRIPTION_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Regular.ttf`;
//const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Rubik_Glitch/RubikGlitch-Regular.ttf`;
const MODEL_PATH = `${ASSET_BASE}Assets/test-two.glb`;
const LABS_LOGO_PATH = `${ASSET_BASE}Assets/images/labs_logo.png`;

const HOME_TITLE = "UQ Reality Labs est. 2022";
const HOME_DESCRIPTION = "Scroll down for more!";

const ABOUT_TITLE = "About";
const ABOUT_DESCRIPTION = "UQ Reality Labs is Australia's first Augmented and Virtual Reality Club. \
 \nUQ Union Best Faculty Club (EAIT) 2024. \n UQ Union Best Small Club 2023. \n Join Us!";

const JOIN_LINK = "https://campus.hellorubric.com/?s=5809";
const ABOUT_SECTION_INDEX = 1;
const RUBRIC_IMAGE_PATH = `${ASSET_BASE}Assets/images/rubric.png`;
const ABOUT_IMAGE_Y_OFFSET = -5;
const ABOUT_IMAGE_HEIGHT = 8;

const CONTACT_TITLE = "Contact";
const CONTACT_DESCRIPTION = "Here are some ways to get in touch with us";

const SPONSOR_TITLE = "Sponsors";
const SPONSOR_DESCRIPTION = "Here are some of the companies that support us!\n Send us an email to sponsor us.";
const NUAXION_LOGO_PATH = `${ASSET_BASE}Assets/images/nuaxion_logo.avif`;
const SPONSOR_SECTION_INDEX = 3;
const SPONSOR_IMAGE_Y_OFFSET = -5;
const SPONSOR_IMAGE_HEIGHT = 8;


const COMMITTEE_TITLE = "Committee";
const COMMITTEE_DESCRIPTION = "Meet the UQ Reality Labs committee.";

const CYRUS_LINK = "https://www.linkedin.com/in/cyrus-forudi/";
const NAVYA_LINK = "https://www.linkedin.com/in/navpas/"
const AMNA_LINK = "https://www.linkedin.com/in/amna-ar/"
const RADHESH_LINK = "https://www.linkedin.com/in/radhesh-g/"
const CLARE_LINK = "https://www.linkedin.com/in/clare-johnston-koto/"
const DORIS_LINK = "https://www.linkedin.com/in/doriswei/"
const CHLOE_LINK = "https://www.linkedin.com/in/chloe-lim-10a840386/"

const CYRUS_TITLE = "President"
const NAVYA_TITLE = "Secretary"
const AMNA_TITLE = "Treasurer"
const CLARE_TITLE = "Events"
const CHLOE_TITLE = "Media"
const RADHESH_TITLE = "Workshop"
const DORIS_TITLE = "Industry";

const COMMITTEE_SECTION_INDEX = 4;
const COMMITTEE_BASE_POSITION = { x: 0, y: 4, z: -25 };
const COMMITTEE_IMAGE_HEIGHT = 5;
const COMMITTEE_IMAGE_SPACING = 10;
const COMMITTEE_ROW_SPACING = 8;
const COMMITTEE_CAPTION_GAP = 0.5;
const COMMITTEE_CAPTION_FONT_SIZE = 0.85;

const COMMITTEE_ROWS = [
  [
    {
      image: `${ASSET_BASE}Assets/images/Cyrus.png`,
      url: CYRUS_LINK,
      title: CYRUS_TITLE,
    },
    {
      image: `${ASSET_BASE}Assets/images/Navya.png`,
      url: NAVYA_LINK,
      title: NAVYA_TITLE,
    },
    {
      image: `${ASSET_BASE}Assets/images/Amna.png`,
      url: AMNA_LINK,
      title: AMNA_TITLE,
    },
  ],
  [
    {
      image: `${ASSET_BASE}Assets/images/Chloe.png`,
      url: CHLOE_LINK,
      title: CHLOE_TITLE,
    },
    {
      image: `${ASSET_BASE}Assets/images/Clare.png`,
      url: CLARE_LINK,
      title: CLARE_TITLE,
    },
    {
      image: `${ASSET_BASE}Assets/images/Radhesh.png`,
      url: RADHESH_LINK,
      title: RADHESH_TITLE,
    },
    {
      image: `${ASSET_BASE}Assets/images/doris.jpg`,
      url: DORIS_LINK,
      title: DORIS_TITLE,
    },
  ],
];

const INSTAGRAM_LINK = "https://www.instagram.com/uqrealitylabs/";
const LINKEDIN_LINK = "https://www.linkedin.com/company/uq-reality-labs";
const DISCORD_LINK = "https://discord.com/invite/eN6v8R3fYD";
const EMAIL_LINK = "mailto:uqrealitylabs@gmail.com";

const CONTACT_SECTION_INDEX = 2;
const SOCIAL_CUBE_SIZE = 2.4;
const SOCIAL_CUBE_SPACING = 6;
const SOCIAL_CUBE_BASE = {
  x: 0,
  y: 4 + DESCRIPTION_Y_OFFSET,
  z: -20,
};
const SOCIAL_CUBE_SCALE_MIN = 1;
const SOCIAL_CUBE_SCALE_MAX = 1.2;
const SOCIAL_CUBE_FLOAT_DISTANCE = 0.35;
const SOCIAL_CUBE_FLOAT_DURATION = 2;
const SOCIAL_CUBE_GROW_DURATION = 0.8;
const SOCIAL_CUBE_ENTRANCE_DURATION = 2;
const SOCIAL_CUBE_ENTRANCE_EASE = "power3.out";
const SOCIAL_CUBE_ENTRANCE_OFFSET = 12;
const SOCIAL_CUBE_EXIT_DURATION = 2;
const SOCIAL_CUBE_EXIT_EASE = "power3.in";
const SOCIAL_CUBE_EXIT_OFFSET = 35;

const SOCIAL_CUBES = [
  {
    texture: `${ASSET_BASE}Assets/images/linkedin.png`,
    url: LINKEDIN_LINK,
    xOffset: -SOCIAL_CUBE_SPACING * 1.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/instagram.jpg`,
    url: INSTAGRAM_LINK,
    xOffset: -SOCIAL_CUBE_SPACING * 0.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/discord.jpg`,
    url: DISCORD_LINK,
    xOffset: SOCIAL_CUBE_SPACING * 0.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/email.jpg`,
    url: EMAIL_LINK,
    xOffset: SOCIAL_CUBE_SPACING * 1.5,
  },
];


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
  { x: -3, y: 10, z: -20, text: ABOUT_TITLE },
  { x: -5, y: 10, z: -20, text: CONTACT_TITLE },
  { x: -10, y: 10, z: -20, text: SPONSOR_TITLE },
  { x: -10, y: 10, z: -20, text: COMMITTEE_TITLE },
];

const DESCRIPTION_SECTIONS = [
  { x: -8, y: 0 + DESCRIPTION_Y_OFFSET, z: -20, text: HOME_DESCRIPTION },
  { x: 0, y: 13 + DESCRIPTION_Y_OFFSET, z: -20, text: ABOUT_DESCRIPTION, textAlign: "center", anchorX: "center" },
  { x: -15, y: 10 + DESCRIPTION_Y_OFFSET, z: -20, text: CONTACT_DESCRIPTION },
  { x: -16, y: 12 + DESCRIPTION_Y_OFFSET, z: -20, text: SPONSOR_DESCRIPTION },
  { x: -15, y: 13 + DESCRIPTION_Y_OFFSET, z: -20, text: COMMITTEE_DESCRIPTION },
];

const SPONSOR_IMAGE_POS = { x: 0, y: 5, z: -20 };
const ABOUT_IMAGE_POS = { x: 0, y: 0, z: -25 };

// UQRL model thing
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
let sectionDescriptionTexts = [];
let socialCubes = [];
let sponsorImage = null;
let aboutJoinImage = null;
let committeeMembers = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
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

function revealSectionDescription(index) {
  return revealTextMesh(sectionDescriptionTexts[index]);
}

function hideSectionDescription(index) {
  return hideTextMesh(sectionDescriptionTexts[index]);
}

function revealSectionContent(index) {
  const promises = [
    revealSectionText(index),
    revealSectionDescription(index),
  ];

  if (index === SPONSOR_SECTION_INDEX) {
    promises.push(revealSponsorImage());
  }

  if (index === ABOUT_SECTION_INDEX) {
    promises.push(revealAboutJoinImage());
  }

  if (index === COMMITTEE_SECTION_INDEX) {
    promises.push(revealCommitteeMembers());
  }

  return Promise.all(promises);
}

function hideSectionContent(index) {
  const promises = [
    hideSectionText(index),
    hideSectionDescription(index),
  ];

  if (index === SPONSOR_SECTION_INDEX) {
    promises.push(hideSponsorImage());
  }

  if (index === ABOUT_SECTION_INDEX) {
    promises.push(hideAboutJoinImage());
  }

  if (index === COMMITTEE_SECTION_INDEX) {
    promises.push(hideCommitteeMembers());
  }

  return Promise.all(promises);
}

function createSectionText(section, options = {}) {
  const {
    font = TITLE_FONT,
    fontSize = TEXT_FONT_SIZE,
    anchorY = "middle",
    textAlign = section.textAlign ?? "left",
    anchorX = section.anchorX ?? "left",
  } = options;
  const outText = new Text();

  outText.userData.fullText = section.text;
  outText.text = "";
  outText.font = font;
  outText.fontSize = fontSize;
  outText.color = 0xffffff;
  outText.maxWidth = TEXT_MAX_WIDTH;
  outText.position.set(section.x, section.y, section.z);
  outText.textAlign = textAlign;
  outText.anchorX = anchorX;
  outText.anchorY = anchorY;
  outText.visible = false;
  outText.sync();

  scene.add(outText);
  return outText;
}

function initSectionTexts() {
  sectionTexts = TEXT_SECTIONS.map((section) => createSectionText(section));
  sectionDescriptionTexts = DESCRIPTION_SECTIONS.map((section) =>
    createSectionText(section, {
      font: DESCRIPTION_FONT,
      fontSize: DESCRIPTION_FONT_SIZE,
      anchorY: "top",
    })
  );
}

function createSponsorImage() {
  const sponsorDescription = SPONSOR_IMAGE_POS;
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  mesh.position.set(
    sponsorDescription.x,
    sponsorDescription.y + SPONSOR_IMAGE_Y_OFFSET,
    sponsorDescription.z
  );
  mesh.visible = false;
  scene.add(mesh);

  textureLoader.load(NUAXION_LOGO_PATH, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.needsUpdate = true;

    const aspect = texture.image.width / texture.image.height;
    const height = SPONSOR_IMAGE_HEIGHT;
    const width = height * aspect;

    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height);
  });

  return mesh;
}

function stopSponsorImageFade() {
  if (!sponsorImage) return;

  gsap.killTweensOf(sponsorImage.material);
}

function revealSponsorImage() {
  if (!sponsorImage) return Promise.resolve();

  stopSponsorImageFade();
  sponsorImage.visible = true;

  return new Promise((resolve) => {
    gsap.to(sponsorImage.material, {
      opacity: 1,
      duration: TEXT_REVEAL_DURATION,
      ease: "power2.out",
      onComplete: resolve,
    });
  });
}

function hideSponsorImage() {
  if (!sponsorImage) return Promise.resolve();

  stopSponsorImageFade();

  return new Promise((resolve) => {
    gsap.to(sponsorImage.material, {
      opacity: 0,
      duration: TEXT_HIDE_DURATION,
      ease: "power2.in",
      onComplete: () => {
        sponsorImage.visible = false;
        resolve();
      },
    });
  });
}

function createAboutJoinImage() {
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  mesh.position.set(
    ABOUT_IMAGE_POS.x,
    ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    ABOUT_IMAGE_POS.z
  );
  mesh.userData.url = JOIN_LINK;
  mesh.visible = false;
  scene.add(mesh);

  textureLoader.load(RUBRIC_IMAGE_PATH, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.needsUpdate = true;

    const aspect = texture.image.width / texture.image.height;
    const height = ABOUT_IMAGE_HEIGHT;
    const width = height * aspect;

    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height);
  });

  return mesh;
}

function stopAboutJoinImageFade() {
  if (!aboutJoinImage) return;

  gsap.killTweensOf(aboutJoinImage.material);
}

function revealAboutJoinImage() {
  if (!aboutJoinImage) return Promise.resolve();

  stopAboutJoinImageFade();
  aboutJoinImage.visible = true;

  return new Promise((resolve) => {
    gsap.to(aboutJoinImage.material, {
      opacity: 1,
      duration: TEXT_REVEAL_DURATION,
      ease: "power2.out",
      onComplete: resolve,
    });
  });
}

function hideAboutJoinImage() {
  if (!aboutJoinImage) return Promise.resolve();

  stopAboutJoinImageFade();

  return new Promise((resolve) => {
    gsap.to(aboutJoinImage.material, {
      opacity: 0,
      duration: TEXT_HIDE_DURATION,
      ease: "power2.in",
      onComplete: () => {
        aboutJoinImage.visible = false;
        resolve();
      },
    });
  });
}

function updateAboutJoinHover() {
  if (
    currentIndex !== ABOUT_SECTION_INDEX ||
    isAnimating ||
    !aboutJoinImage?.visible
  ) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(aboutJoinImage);

  canvas.style.cursor = intersects.length > 0 ? "pointer" : "default";
}

function setupAboutJoinInteraction() {
  canvas.addEventListener("click", (event) => {
    if (
      currentIndex !== ABOUT_SECTION_INDEX ||
      isAnimating ||
      !aboutJoinImage?.visible
    ) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(aboutJoinImage);

    if (intersects.length > 0) {
      window.open(aboutJoinImage.userData.url, "_blank", "noopener,noreferrer");
    }
  });
}

function getCommitteeMemberPosition(rowIndex, colIndex, rowLength) {
  const xOffset = (colIndex - (rowLength - 1) / 2) * COMMITTEE_IMAGE_SPACING;
  const y = COMMITTEE_BASE_POSITION.y - rowIndex * COMMITTEE_ROW_SPACING;

  return {
    x: COMMITTEE_BASE_POSITION.x + xOffset,
    y,
    z: COMMITTEE_BASE_POSITION.z,
  };
}

function createCommitteeCaption(title, position, imageHeight) {
  const caption = new Text();

  caption.text = title;
  caption.font = DESCRIPTION_FONT;
  caption.fontSize = COMMITTEE_CAPTION_FONT_SIZE;
  caption.color = 0xffffff;
  caption.anchorX = "center";
  caption.anchorY = "top";
  caption.textAlign = "center";
  caption.fillOpacity = 0;
  caption.position.set(
    position.x,
    position.y - imageHeight / 2 - COMMITTEE_CAPTION_GAP,
    position.z
  );
  caption.visible = false;
  caption.sync();

  scene.add(caption);
  return caption;
}

function createCommitteeMembers() {
  const textureLoader = new THREE.TextureLoader();
  const members = [];

  COMMITTEE_ROWS.forEach((row, rowIndex) => {
    row.forEach((config, colIndex) => {
      const position = getCommitteeMemberPosition(
        rowIndex,
        colIndex,
        row.length
      );
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      });
      const image = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

      image.position.set(position.x, position.y, position.z);
      image.userData.url = config.url;
      image.userData.fadeTween = null;
      image.visible = false;
      scene.add(image);

      const caption = createCommitteeCaption(
        config.title,
        position,
        COMMITTEE_IMAGE_HEIGHT
      );
      caption.userData.fadeTween = null;

      textureLoader.load(config.image, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;

        const aspect = texture.image.width / texture.image.height;
        const height = COMMITTEE_IMAGE_HEIGHT;
        const width = height * aspect;

        image.geometry.dispose();
        image.geometry = new THREE.PlaneGeometry(width, height);
        caption.position.y =
          position.y - height / 2 - COMMITTEE_CAPTION_GAP;
      });

      members.push({ image, caption, url: config.url });
    });
  });

  return members;
}

function stopCommitteeMemberFade(member) {
  if (member.image.userData.fadeTween) {
    member.image.userData.fadeTween.kill();
    member.image.userData.fadeTween = null;
  }

  if (member.caption.userData.fadeTween) {
    member.caption.userData.fadeTween.kill();
    member.caption.userData.fadeTween = null;
  }
}

function revealCommitteeMembers() {
  if (committeeMembers.length === 0) return Promise.resolve();

  return Promise.all(
    committeeMembers.map((member) => {
      stopCommitteeMemberFade(member);
      member.image.visible = true;
      member.caption.visible = true;
      member.caption.fillOpacity = 0;
      member.caption.sync();

      return Promise.all([
        new Promise((resolve) => {
          member.image.userData.fadeTween = gsap.to(member.image.material, {
            opacity: 1,
            duration: TEXT_REVEAL_DURATION,
            ease: "power2.out",
            onComplete: () => {
              member.image.userData.fadeTween = null;
              resolve();
            },
          });
        }),
        new Promise((resolve) => {
          member.caption.userData.fadeTween = gsap.to(member.caption, {
            fillOpacity: 1,
            duration: TEXT_REVEAL_DURATION,
            ease: "power2.out",
            onUpdate: () => member.caption.sync(),
            onComplete: () => {
              member.caption.userData.fadeTween = null;
              resolve();
            },
          });
        }),
      ]);
    })
  );
}

function hideCommitteeMembers() {
  if (committeeMembers.length === 0) return Promise.resolve();

  return Promise.all(
    committeeMembers.map((member) => {
      stopCommitteeMemberFade(member);

      return Promise.all([
        new Promise((resolve) => {
          member.image.userData.fadeTween = gsap.to(member.image.material, {
            opacity: 0,
            duration: TEXT_HIDE_DURATION,
            ease: "power2.in",
            onComplete: () => {
              member.image.visible = false;
              member.image.userData.fadeTween = null;
              resolve();
            },
          });
        }),
        new Promise((resolve) => {
          member.caption.userData.fadeTween = gsap.to(member.caption, {
            fillOpacity: 0,
            duration: TEXT_HIDE_DURATION,
            ease: "power2.in",
            onUpdate: () => member.caption.sync(),
            onComplete: () => {
              member.caption.visible = false;
              member.caption.userData.fadeTween = null;
              resolve();
            },
          });
        }),
      ]);
    })
  );
}

function getVisibleCommitteeImages() {
  return committeeMembers
    .map((member) => member.image)
    .filter((image) => image.visible);
}

function updateCommitteeHover() {
  if (
    currentIndex !== COMMITTEE_SECTION_INDEX ||
    isAnimating ||
    committeeMembers.length === 0
  ) {
    return;
  }

  const visibleImages = getVisibleCommitteeImages();
  if (visibleImages.length === 0) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(visibleImages);

  canvas.style.cursor = intersects.length > 0 ? "pointer" : "default";
}

function setupCommitteeInteraction() {
  canvas.addEventListener("click", (event) => {
    if (
      currentIndex !== COMMITTEE_SECTION_INDEX ||
      isAnimating ||
      getVisibleCommitteeImages().length === 0
    ) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getVisibleCommitteeImages());

    if (intersects.length > 0) {
      const url = intersects[0].object.userData.url;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });
}

function warmupTextMeshes(textMeshes) {
  return Promise.all(
    textMeshes.map(
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

function warmupSectionTexts() {
  return Promise.all([
    warmupTextMeshes(sectionTexts),
    warmupTextMeshes(sectionDescriptionTexts),
  ]);
}

function createSocialCubes() {
  const textureLoader = new THREE.TextureLoader();

  return SOCIAL_CUBES.map((config) => {
    const texture = textureLoader.load(config.texture);
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(SOCIAL_CUBE_SIZE, SOCIAL_CUBE_SIZE, SOCIAL_CUBE_SIZE),
      new THREE.MeshBasicMaterial({ map: texture })
    );

    cube.position.set(
      SOCIAL_CUBE_BASE.x + config.xOffset,
      SOCIAL_CUBE_BASE.y,
      SOCIAL_CUBE_BASE.z
    );
    cube.userData.url = config.url;
    cube.userData.baseX = cube.position.x;
    cube.userData.baseY = cube.position.y;
    cube.userData.hovered = false;
    cube.userData.floatTween = null;
    cube.userData.growTween = null;
    cube.userData.entranceTween = null;
    cube.userData.exitTween = null;
    cube.visible = false;
    cube.scale.set(
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN
    );
    scene.add(cube);
    return cube;
  });
}

function stopSocialCubeExit(cube) {
  if (cube.userData.exitTween) {
    cube.userData.exitTween.kill();
    cube.userData.exitTween = null;
  }
}

function stopSocialCubeEntrance(cube) {
  if (cube.userData.entranceTween) {
    cube.userData.entranceTween.kill();
    cube.userData.entranceTween = null;
  }
}

function stopSocialCubeFloat(cube) {
  if (cube.userData.floatTween) {
    cube.userData.floatTween.kill();
    cube.userData.floatTween = null;
  }

  cube.position.y = cube.userData.baseY;
}

function startSocialCubeFloat(cube, delay = 0) {
  stopSocialCubeFloat(cube);

  cube.userData.floatTween = gsap.to(cube.position, {
    y: cube.userData.baseY + SOCIAL_CUBE_FLOAT_DISTANCE,
    duration: SOCIAL_CUBE_FLOAT_DURATION + delay,
    delay,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}

function stopSocialCubeGrow(cube) {
  if (cube.userData.growTween) {
    cube.userData.growTween.kill();
    cube.userData.growTween = null;
  }
}

function setSocialCubeHovered(cube, hovered) {
  stopSocialCubeGrow(cube);

  if (hovered) {
    cube.userData.growTween = gsap.to(cube.scale, {
      x: SOCIAL_CUBE_SCALE_MAX,
      y: SOCIAL_CUBE_SCALE_MAX,
      z: SOCIAL_CUBE_SCALE_MAX,
      duration: SOCIAL_CUBE_GROW_DURATION,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  } else {
    gsap.to(cube.scale, {
      x: SOCIAL_CUBE_SCALE_MIN,
      y: SOCIAL_CUBE_SCALE_MIN,
      z: SOCIAL_CUBE_SCALE_MIN,
      duration: 0.3,
      ease: "power2.out",
    });
  }

  cube.userData.hovered = hovered;
}

function startSocialCubeEntrance() {
  socialCubes.forEach((cube, index) => {
    stopSocialCubeEntrance(cube);
    stopSocialCubeFloat(cube);

    cube.position.y = cube.userData.baseY - SOCIAL_CUBE_ENTRANCE_OFFSET;

    cube.userData.entranceTween = gsap.to(cube.position, {
      y: cube.userData.baseY,
      duration: SOCIAL_CUBE_ENTRANCE_DURATION,
      ease: SOCIAL_CUBE_ENTRANCE_EASE,
      onComplete: () => {
        cube.userData.entranceTween = null;
        startSocialCubeFloat(cube, index * 0.15);
      },
    });
  });
}

function resetSocialCubeTransform(cube) {
  cube.position.set(
    cube.userData.baseX,
    cube.userData.baseY,
    SOCIAL_CUBE_BASE.z
  );
}

function stopSocialCubeAnimations() {
  socialCubes.forEach((cube) => {
    stopSocialCubeEntrance(cube);
    stopSocialCubeExit(cube);
    stopSocialCubeFloat(cube);
    stopSocialCubeGrow(cube);
    cube.userData.hovered = false;
    resetSocialCubeTransform(cube);
    cube.scale.set(
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN
    );
  });
}

function hideSocialCubes() {
  canvas.style.cursor = "default";

  const visibleCubes = socialCubes.filter((cube) => cube.visible);
  if (visibleCubes.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let completed = 0;

    visibleCubes.forEach((cube) => {
      stopSocialCubeEntrance(cube);
      stopSocialCubeExit(cube);
      stopSocialCubeFloat(cube);
      stopSocialCubeGrow(cube);
      cube.userData.hovered = false;
      cube.scale.set(
        SOCIAL_CUBE_SCALE_MIN,
        SOCIAL_CUBE_SCALE_MIN,
        SOCIAL_CUBE_SCALE_MIN
      );

      cube.userData.exitTween = gsap.to(cube.position, {
        x: cube.userData.baseX + SOCIAL_CUBE_EXIT_OFFSET,
        duration: SOCIAL_CUBE_EXIT_DURATION,
        ease: SOCIAL_CUBE_EXIT_EASE,
        onComplete: () => {
          cube.userData.exitTween = null;
          cube.visible = false;
          resetSocialCubeTransform(cube);
          completed += 1;

          if (completed === visibleCubes.length) {
            resolve();
          }
        },
      });
    });
  });
}

function setSocialCubesVisible(visible) {
  socialCubes.forEach((cube) => {
    cube.visible = visible;
  });

  if (visible) {
    startSocialCubeEntrance();
  } else {
    stopSocialCubeAnimations();
    canvas.style.cursor = "default";
  }
}

function resetSocialCubeHover(cube) {
  setSocialCubeHovered(cube, false);
}

function updateSocialCubeHover() {
  if (
    currentIndex !== CONTACT_SECTION_INDEX ||
    isAnimating ||
    !socialCubes.some((cube) => cube.visible)
  ) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const visibleCubes = socialCubes.filter((cube) => cube.visible);
  const intersects = raycaster.intersectObjects(visibleCubes);
  const hoveredCube = intersects[0]?.object ?? null;
  let pointerActive = false;

  visibleCubes.forEach((cube) => {
    if (cube === hoveredCube) {
      pointerActive = true;

      if (!cube.userData.hovered) {
        setSocialCubeHovered(cube, true);
      }
    } else if (cube.userData.hovered) {
      resetSocialCubeHover(cube);
    }
  });

  canvas.style.cursor = pointerActive ? "pointer" : "default";
}

function setupSocialCubeInteraction() {
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("click", () => {
    if (
      currentIndex !== CONTACT_SECTION_INDEX ||
      isAnimating ||
      !socialCubes.some((cube) => cube.visible)
    ) {
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      socialCubes.filter((cube) => cube.visible)
    );

    if (intersects.length > 0) {
      const url = intersects[0].object.userData.url;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });
}

async function transitionToSection(newIndex) {
  if (!modelGroup || isAnimating || newIndex === currentIndex) return;
  if (newIndex < 0 || newIndex >= MODEL_SECTIONS.length) return;

  isAnimating = true;
  const oldIndex = currentIndex;

  await hideSectionContent(oldIndex);

  let socialCubesExitPromise = Promise.resolve();
  if (oldIndex === CONTACT_SECTION_INDEX) {
    socialCubesExitPromise = hideSocialCubes();
  }

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

  await Promise.all([
    socialCubesExitPromise,
    new Promise((resolve) => {
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
    }),
  ]);

  await revealSectionContent(currentIndex);

  if (currentIndex === CONTACT_SECTION_INDEX) {
    setSocialCubesVisible(true);
  }

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
sponsorImage = createSponsorImage();
aboutJoinImage = createAboutJoinImage();
committeeMembers = createCommitteeMembers();
setupNavbar();
socialCubes = createSocialCubes();
setupSocialCubeInteraction();
setupAboutJoinInteraction();
setupCommitteeInteraction();

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
      await revealSectionContent(0);
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
  updateSocialCubeHover();
  updateAboutJoinHover();
  updateCommitteeHover();

  if (ENABLE_ORBIT_CONTROLS && controls) {
    controls.update();
  }

  if (ENABLE_LIGHT_DEBUG) {
    lightHelpers.forEach((helper) => helper.update());
  }

  renderer.render(scene, camera);
}

animate();
