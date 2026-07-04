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
const STAR_COUNT = 90;
const STAR_RADIUS = 0.16;
const STAR_DRIFT_DISTANCE = 200;
const SECTION_Y_STEP = 200;
const TEXT_FONT_SIZE = 2;
const TEXT_MAX_WIDTH = 40;
const TEXT_REVEAL_DURATION = 0.42;
const TEXT_HIDE_DURATION = 0.22;
const DESCRIPTION_Y_OFFSET = -5;
const DESCRIPTION_FONT_SIZE = 1.25;
const COMPACT_VIEWPORT_WIDTH = 860;
const SHORT_VIEWPORT_HEIGHT = 680;
const POINTER_IDLE_MS = 900;
const POINTER_DAMPING = 0.08;
const REDUCED_POINTER_DAMPING = 0.025;
const CAMERA_ANCHOR_SECTION_INDEX = 0;

const ASSET_BASE = import.meta.env.BASE_URL;
const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Medium.ttf`;
const DESCRIPTION_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Regular.ttf`;
const MODEL_PATH = `${ASSET_BASE}Assets/keything.glb`;
const LABS_LOGO_PATH = `${ASSET_BASE}Assets/images/labs_logo.png`;

const TAB_ORDER = ["home", "about", "contact", "sponsors", "committee"];
const TAB_PARTIALS = import.meta.glob("./tabs/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

function compactContentText(text = "") {
  return text.trim().replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
}

function readTabPartial(slug) {
  const html = TAB_PARTIALS[`./tabs/${slug}.html`];
  if (!html) throw new Error(`Missing tab partial: ${slug}`);

  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const section = template.content.querySelector("[data-tab]");
  const links = Object.fromEntries(
    [...template.content.querySelectorAll("[data-link]")].map((link) => [
      link.dataset.link,
      link.getAttribute("href"),
    ])
  );

  return {
    slug,
    label: section?.dataset.label || slug,
    shortLabel: section?.dataset.short || section?.dataset.label || slug,
    title: compactContentText(section?.querySelector("h1")?.textContent || slug),
    description: compactContentText(section?.querySelector("p")?.textContent || ""),
    links,
  };
}

function withBasePath(path = "") {
  if (/^(https?:|mailto:)/.test(path)) return path;
  return `${ASSET_BASE}${path.replace(/^\/+/, "")}`;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: markdown.trim() };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = key === "order" ? Number(value) : value;
  }

  return { data, body: match[2].trim() };
}

async function loadCommitteeRows() {
  const manifestResponse = await fetch(withBasePath("content/roles/index.json"));
  const manifest = await manifestResponse.json();
  const membersByRole = new Map();

  for (const role of manifest.roles || []) {
    const members = await Promise.all(
      (role.members || []).map(async (memberPath) => {
        const response = await fetch(withBasePath(memberPath));
        const { data, body } = parseFrontmatter(await response.text());

        return {
          image: withBasePath(data.photo),
          url: data.linkedin,
          name: data.name,
          title: data.role || role.label,
          shortBio: data.shortBio,
          body,
          slugline: data.slugline || data.microcopy || role.label,
          microcopy: data.microcopy || data.slugline || role.label,
          accentColor: data.accentColor || role.accentColors?.[0] || "#FF5757",
          pathVariant: data.pathVariant || role.pathVariant || "underline-swoop",
          order: Number.isFinite(data.order) ? data.order : 0,
          roleSlug: role.slug,
        };
      })
    );

    membersByRole.set(role.slug, members.sort((a, b) => a.order - b.order));
  }

  const rows = (manifest.rows || []).map((row) =>
    row.flatMap((roleSlug) => membersByRole.get(roleSlug) || [])
  );

  return rows.filter((row) => row.length > 0);
}

const TABS = TAB_ORDER.map(readTabPartial);
const SECTION_INDEX = Object.fromEntries(TABS.map((tab, index) => [tab.slug, index]));
const ABOUT_SECTION_INDEX = SECTION_INDEX.about;
const RUBRIC_IMAGE_PATH = `${ASSET_BASE}Assets/images/rubric.png`;
const ABOUT_IMAGE_Y_OFFSET = -5;
const ABOUT_IMAGE_HEIGHT = 5.2;
const JOIN_LINK = TABS[ABOUT_SECTION_INDEX].links.join;
const NUAXION_LOGO_PATH = `${ASSET_BASE}Assets/images/nuaxion_logo.avif`;
const SPONSOR_SECTION_INDEX = SECTION_INDEX.sponsors;
const SPONSOR_IMAGE_Y_OFFSET = -5;
const SPONSOR_IMAGE_HEIGHT = 4.2;

const COMMITTEE_SECTION_INDEX = SECTION_INDEX.committee;
const COMMITTEE_BASE_POSITION = { x: 0, y: 4, z: -25 };
const COMMITTEE_IMAGE_HEIGHT = 5;
const COMMITTEE_IMAGE_SPACING = 10;
const COMMITTEE_ROW_SPACING = 8;
const COMMITTEE_CAPTION_GAP = 0.5;
const COMMITTEE_CAPTION_FONT_SIZE = 0.85;
let COMMITTEE_ROWS = [];

const INSTAGRAM_LINK = "https://www.instagram.com/uqrealitylabs/";
const LINKEDIN_LINK = "https://www.linkedin.com/company/uq-reality-labs";
const DISCORD_LINK = "https://discord.com/invite/eN6v8R3fYD";
const EMAIL_LINK = "mailto:uqrealitylabs@gmail.com";

const CONTACT_SECTION_INDEX = SECTION_INDEX.contact;
const SOCIAL_CUBE_SPACING = 6;
const SOCIAL_CUBE_BASE = {
  x: 0,
  y: 4 + DESCRIPTION_Y_OFFSET,
  z: -20,
};
const SOCIAL_CUBE_SCALE_MIN = 1;
const SOCIAL_CUBE_SCALE_MAX = 1.08;
const SOCIAL_CUBE_FLOAT_DISTANCE = 0.22;
const SOCIAL_CUBE_FLOAT_DURATION = 0.72;
const SOCIAL_CUBE_GROW_DURATION = 0.18;
const SOCIAL_CUBE_ENTRANCE_DURATION = 0.68;
const SOCIAL_CUBE_ENTRANCE_EASE = "power3.out";
const SOCIAL_CUBE_ENTRANCE_OFFSET = 12;
const SOCIAL_CUBE_EXIT_DURATION = 0.5;
const SOCIAL_CUBE_EXIT_EASE = "power3.in";
const SOCIAL_CUBE_EXIT_OFFSET = 35;
const SOCIAL_CARD_DEPTH = 0.42;

const SOCIAL_CUBES = [
  {
    texture: `${ASSET_BASE}Assets/images/linkedin.png`,
    url: LINKEDIN_LINK,
    label: "LinkedIn",
    accent: "#0A66C2",
    xOffset: -SOCIAL_CUBE_SPACING * 1.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/instagram.jpg`,
    url: INSTAGRAM_LINK,
    label: "Instagram",
    accent: "#E1306C",
    xOffset: -SOCIAL_CUBE_SPACING * 0.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/discord.jpg`,
    url: DISCORD_LINK,
    label: "Discord",
    accent: "#5865F2",
    xOffset: SOCIAL_CUBE_SPACING * 0.5,
  },
  {
    texture: `${ASSET_BASE}Assets/images/email.jpg`,
    url: EMAIL_LINK,
    label: "Email",
    accent: "#F59E0B",
    xOffset: SOCIAL_CUBE_SPACING * 1.5,
  },
];


// scroll down moves to the next section (model shifts down on Y)
const MODEL_SECTIONS = TABS.map((tab, index) => ({
  x: 0,
  y: -SECTION_Y_STEP * index,
  z: -20,
  label: tab.label,
}));

// these are relative to the camera
const TEXT_LAYOUTS = [
  { x: 0, y: 9.8, z: -20, textAlign: "center", anchorX: "center" },
  { x: -3, y: 10, z: -20 },
  { x: -5, y: 10, z: -20 },
  { x: -10, y: 10, z: -20 },
  { x: -10, y: 10, z: -20 },
];

const DESCRIPTION_LAYOUTS = [
  { x: 0, y: -1.2, z: -20, textAlign: "center", anchorX: "center" },
  { x: 0, y: 13 + DESCRIPTION_Y_OFFSET, z: -20, textAlign: "center", anchorX: "center" },
  { x: -15, y: 10 + DESCRIPTION_Y_OFFSET, z: -20 },
  { x: -16, y: 12 + DESCRIPTION_Y_OFFSET, z: -20 },
  { x: -15, y: 13 + DESCRIPTION_Y_OFFSET, z: -20 },
];

const TEXT_SECTIONS = TABS.map((tab, index) => ({
  ...TEXT_LAYOUTS[index],
  text: tab.title,
}));

const DESCRIPTION_SECTIONS = TABS.map((tab, index) => ({
  ...DESCRIPTION_LAYOUTS[index],
  text: tab.description,
}));

const COMPACT_TEXT_LAYOUTS = [
  { x: 0, y: 9.2, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 8.6, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 8.6, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 8.6, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 8.6, z: -18, textAlign: "center", anchorX: "center" },
];

const COMPACT_DESCRIPTION_LAYOUTS = [
  { x: 0, y: -3.6, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 5.8, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 5.4, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 5.6, z: -18, textAlign: "center", anchorX: "center" },
  { x: 0, y: 5.6, z: -18, textAlign: "center", anchorX: "center" },
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
const RAINBOW_GLOW_SCALE = 5.8;
const RAINBOW_OUTER_GLOW_SCALE = 8;
const RAINBOW_LIGHT_INTENSITY = 1.5;
const RAINBOW_LIGHT_DISTANCE = 40;
const RAINBOW_LIGHT_DECAY = 0.75;

const canvas = document.querySelector("#canvas");
const statusLabel = document.querySelector("#status");
const navbar = document.querySelector("#navbar");
const navLogoImage = document.querySelector("#nav-logo-img");
const navLinks = document.querySelector("#nav-links");

if (navLinks) {
  navLinks.innerHTML = TABS.map(
    (tab, index) =>
      `<button type="button" data-section="${index}" data-short="${tab.shortLabel}"><span>${tab.label}</span></button>`
  ).join("");
}

const navSectionButtons = document.querySelectorAll("#navbar [data-section]");
const memberPopup = document.querySelector("#member-popup");
const memberPopupCard = document.querySelector(".member-popup__card");
const memberPopupImage = document.querySelector("#member-popup-image");
const memberPopupTitle = document.querySelector("#member-popup-title");
const memberPopupRole = document.querySelector("#member-popup-role");
const memberPopupCopy = document.querySelector("#member-popup-copy");
const memberPopupLink = document.querySelector("#member-popup-link");
let lastMemberTrigger = null;
let currentPopupAnchorObject = null;

if (DEBUG && statusLabel) {
  statusLabel.hidden = false;
  statusLabel.textContent = "Loading…";
}

document.body.dataset.section = "0";

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR_COLOUR);
let canvasRect = canvas.getBoundingClientRect();
let viewportWidth = Math.max(canvas.clientWidth || window.innerWidth, 320);
let viewportHeight = Math.max(canvas.clientHeight || window.innerHeight, 320);

const stars = [];
const starGeometry = new THREE.SphereGeometry(STAR_RADIUS, 8, 8);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

function generateStars() {
  const star = new THREE.Mesh(starGeometry, starMaterial);
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
  viewportWidth / viewportHeight,
  CAM_NEAR,
  CAM_FAR
);

const initialRenderPixelRatio = getRenderPixelRatio();
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: initialRenderPixelRatio <= 2,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.setPixelRatio(initialRenderPixelRatio);
renderer.setSize(viewportWidth, viewportHeight, false);

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
const textureLoader = new THREE.TextureLoader();

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
let rubricMoodTimer = 0;
let committeeMembers = [];
let hoveredCommitteeImage = null;
let cachedViewportLayout = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDirty = true;
let rainbowBackdrop = null;
let rainbowHue = 0;
let roundedAlphaTexture = null;
let baseCameraZ = 5;
let baseCamLeftOffset = 0;
let baseCamHeightOffset = 0;
const pointerTarget = new THREE.Vector2(0, 0);
const pointerCurrent = new THREE.Vector2(0, 0);
const pointerNeutral = new THREE.Vector2(0, 0);
let lastPointerAt = 0;
let parallaxActive = false;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
let animationFrame = 0;
let resizeObserver = null;
let scrollObserver = null;

function motionDuration(seconds) {
  return prefersReducedMotion.matches ? 0 : seconds;
}

function isCompactViewport() {
  return viewportWidth <= COMPACT_VIEWPORT_WIDTH;
}

function isShortViewport() {
  return viewportHeight <= SHORT_VIEWPORT_HEIGHT;
}

function getRenderPixelRatio() {
  const canvasPixels = viewportWidth * viewportHeight;
  const maxRatio = canvasPixels <= 480_000 ? 2.5 : 2;

  return Math.min(window.devicePixelRatio || 1, maxRatio);
}

function updateViewportSize() {
  canvasRect = canvas.getBoundingClientRect();
  const rect = canvasRect;

  viewportWidth = Math.max(Math.round(rect.width || window.innerWidth), 320);
  viewportHeight = Math.max(Math.round(rect.height || window.innerHeight), 240);
  cachedViewportLayout = null;
}

function applyCameraLayout() {
  const layout = getViewportLayout();

  camera.aspect = viewportWidth / viewportHeight;
  camera.fov = layout.narrow ? 66 : layout.compact ? 64 : CAM_FOV;
  cameraZ = baseCameraZ * layout.cameraScale;
  camLeftOffset = baseCamLeftOffset;
  camHeightOffset = baseCamHeightOffset + layout.cameraYOffset;
  camera.updateProjectionMatrix();

  if (modelGroup) {
    setCameraOnModel(getCameraAnchorPos());
    aimLightsAtModel();
  }
}

function applyPointerMotion() {
  const reduced = prefersReducedMotion.matches;
  const now = performance.now();

  if (!parallaxActive || now - lastPointerAt > POINTER_IDLE_MS || reduced) {
    pointerTarget.lerp(pointerNeutral, reduced ? 0.18 : 0.04);

    if (Math.abs(pointerTarget.x) < 0.01 && Math.abs(pointerTarget.y) < 0.01) {
      parallaxActive = false;
      pointerTarget.set(0, 0);
    }
  }

  pointerCurrent.lerp(pointerTarget, reduced ? REDUCED_POINTER_DAMPING : POINTER_DAMPING);

  if (!modelGroup || isAnimating) return;

  const layout = getViewportLayout();
  const sectionPos = getCameraAnchorPos();
  const parallaxX = reduced ? 0 : pointerCurrent.x * (layout.compact ? 0.16 : 0.34);
  const parallaxY = reduced ? 0 : pointerCurrent.y * (layout.compact ? 0.12 : 0.22);

  camera.position.set(
    sectionPos.x - camLeftOffset + parallaxX,
    sectionPos.y + camHeightOffset - parallaxY,
    cameraZ
  );
  lookTarget.set(
    sectionPos.x + parallaxX * 0.25,
    sectionPos.y + modelLookHeight - parallaxY * 0.2,
    sectionPos.z
  );
  camera.lookAt(lookTarget);

  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x) + pointerCurrent.y * 0.025,
    THREE.MathUtils.degToRad(MODEL_ROTATION.y) + pointerCurrent.x * 0.04,
    THREE.MathUtils.degToRad(MODEL_ROTATION.z)
  );

  const tiltX = -pointerCurrent.y * (reduced ? 0.015 : 0.075);
  const tiltY = pointerCurrent.x * (reduced ? 0.02 : 0.11);

  for (const cube of socialCubes) {
    if (cube.visible) {
      cube.rotation.set(tiltX, tiltY, 0);
    }
  }

  for (const member of committeeMembers) {
    if (member.image.visible) {
      member.image.rotation.set(tiltX * 0.65, tiltY * 0.65, 0);
    }
  }

  for (const mesh of [aboutJoinImage, sponsorImage]) {
    if (mesh?.visible) {
      mesh.rotation.set(tiltX * 0.5, tiltY * 0.5, mesh.userData.tiltZ || 0);
    }
  }
}

function getViewportLayout() {
  if (cachedViewportLayout) return cachedViewportLayout;

  const narrow = viewportWidth <= 480;
  const compact = isCompactViewport();
  const tablet = viewportWidth <= 1024;
  const short = isShortViewport();
  const landscape = viewportWidth > viewportHeight && viewportHeight <= 480;
  const wide = viewportWidth >= 1600;

  cachedViewportLayout = {
    narrow,
    compact,
    tablet,
    landscape,
    wide,
    cameraScale: narrow ? 1.32 : compact ? 1.22 : short ? 1.12 : wide ? 0.94 : 1,
    cameraYOffset: narrow ? 0.7 : compact ? 0.4 : 0,
    titleFontSize: narrow ? 1.22 : compact ? 1.36 : short ? 1.55 : wide ? 2.15 : TEXT_FONT_SIZE,
    descriptionFontSize: narrow ? 0.88 : compact ? 0.94 : short ? 1 : DESCRIPTION_FONT_SIZE,
    textMaxWidth: narrow ? 18 : compact ? 22 : short ? 32 : wide ? 46 : TEXT_MAX_WIDTH,
    sponsorImageHeight: compact ? 3.2 : SPONSOR_IMAGE_HEIGHT,
    sponsorImageY: compact ? -0.8 : SPONSOR_IMAGE_POS.y + SPONSOR_IMAGE_Y_OFFSET,
    aboutImageHeight: narrow ? 3.25 : compact ? 3.6 : ABOUT_IMAGE_HEIGHT,
    aboutImageY: narrow ? -1.75 : compact ? -2.05 : ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    socialCubeSpacing: narrow ? 2.9 : compact ? 3.2 : SOCIAL_CUBE_SPACING,
    socialCubeY: compact ? -0.15 : SOCIAL_CUBE_BASE.y,
    socialCardWidth: narrow ? 2.5 : compact ? 2.8 : 3.25,
    socialCardHeight: narrow ? 2.5 : compact ? 2.8 : 3.25,
    committeeImageHeight: narrow ? 2.35 : compact ? 2.65 : tablet ? 4.2 : COMMITTEE_IMAGE_HEIGHT,
    committeeImageSpacing: narrow ? 3.9 : compact ? 4.55 : tablet ? 7 : COMMITTEE_IMAGE_SPACING,
    committeeRowSpacing: narrow ? 3 : compact ? 3.7 : tablet ? 6.2 : COMMITTEE_ROW_SPACING,
    committeeCaptionFontSize: narrow ? 0.65 : compact ? 0.7 : COMMITTEE_CAPTION_FONT_SIZE,
    committeeBaseY: narrow ? 4.4 : compact ? 3.5 : COMMITTEE_BASE_POSITION.y,
    committeeMobileRows: narrow ? [1, 2, 4] : null,
  };

  if (landscape) {
    cachedViewportLayout.titleFontSize = 1.08;
    cachedViewportLayout.descriptionFontSize = 0.78;
    cachedViewportLayout.aboutImageHeight = 2.35;
    cachedViewportLayout.sponsorImageHeight = 2.4;
    cachedViewportLayout.socialCardWidth = 2.2;
    cachedViewportLayout.socialCardHeight = 2.2;
    cachedViewportLayout.committeeImageHeight = 1.85;
    cachedViewportLayout.committeeCaptionFontSize = 0.6;
  }

  return cachedViewportLayout;
}

function getResponsiveSection(section, index, compactLayouts) {
  if (!isCompactViewport()) return section;

  return {
    ...section,
    ...compactLayouts[index],
  };
}

function getSectionPos(index = currentIndex) {
  return MODEL_SECTIONS[index];
}

function getCurrentSectionPos() {
  return getSectionPos(currentIndex);
}

function getCameraAnchorPos() {
  return getSectionPos(CAMERA_ANCHOR_SECTION_INDEX);
}

function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

function updatePointerFromEvent(event) {
  const rect = canvasRect.width ? canvasRect : canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerTarget.set(mouse.x, mouse.y);
  lastPointerAt = performance.now();
  parallaxActive = true;
  pointerDirty = true;
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

function getRoundedAlphaTexture() {
  if (roundedAlphaTexture) return roundedAlphaTexture;

  const size = 512;
  const radius = 88;
  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = size;
  alphaCanvas.height = size;

  const ctx = alphaCanvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  roundedAlphaTexture = new THREE.CanvasTexture(alphaCanvas);
  roundedAlphaTexture.minFilter = THREE.LinearFilter;
  roundedAlphaTexture.magFilter = THREE.LinearFilter;
  return roundedAlphaTexture;
}

function createRoundedImageMaterial() {
  return new THREE.MeshBasicMaterial({
    alphaMap: getRoundedAlphaTexture(),
    alphaTest: 0.02,
    transparent: true,
    opacity: 0,
  });
}

function polishTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function coverSquareTexture(texture, aspect) {
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  if (aspect > 1) {
    texture.repeat.set(1 / aspect, 1);
    texture.offset.set((1 - texture.repeat.x) / 2, 0);
  } else {
    texture.repeat.set(1, aspect);
    texture.offset.set(0, (1 - texture.repeat.y) / 2);
  }

  texture.needsUpdate = true;
}

function createSocialTexture({ label, accent }) {
  const size = 1024;
  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = size;
  iconCanvas.height = size;
  const ctx = iconCanvas.getContext("2d");
  const lower = label.toLowerCase();

  ctx.fillStyle = "#151823";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff3d2";
  ctx.strokeStyle = "#fff3d2";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (lower === "instagram") {
    ctx.lineWidth = 52;
    ctx.strokeRect(270, 270, 484, 484);
    ctx.beginPath();
    ctx.arc(512, 512, 132, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(670, 352, 34, 0, Math.PI * 2);
    ctx.fill();
  } else if (lower === "discord") {
    ctx.lineWidth = 48;
    ctx.beginPath();
    ctx.roundRect(260, 340, 504, 300, 120);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(420, 492, 34, 0, Math.PI * 2);
    ctx.arc(604, 492, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(384, 632);
    ctx.quadraticCurveTo(512, 720, 640, 632);
    ctx.stroke();
  } else if (lower === "email") {
    ctx.lineWidth = 54;
    ctx.strokeRect(236, 330, 552, 364);
    ctx.beginPath();
    ctx.moveTo(236, 344);
    ctx.lineTo(512, 552);
    ctx.lineTo(788, 344);
    ctx.stroke();
  } else {
    ctx.font = "700 360px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("in", 512, 520);
  }

  const texture = new THREE.CanvasTexture(iconCanvas);
  return polishTexture(texture);
}

function createRoundedIconMaterial(texture) {
  polishTexture(texture);

  return new THREE.MeshStandardMaterial({
    map: texture,
    alphaMap: getRoundedAlphaTexture(),
    alphaTest: 0.02,
    transparent: true,
    roughness: 0.72,
    metalness: 0.04,
    emissive: 0x111111,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });
}

function createSocialCardMaterials(texture) {
  const faceMaterial = createRoundedIconMaterial(texture);
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5757,
    roughness: 0.82,
    metalness: 0.03,
    emissive: 0x210606,
    emissiveIntensity: 0.18,
  });
  const backMaterial = edgeMaterial.clone();
  backMaterial.color.set(0x151823);

  return [
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    faceMaterial,
    backMaterial,
  ];
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
  group.userData.baseSize = maxSize;
  group.visible = false;

  for (const mesh of group.userData.glowMeshes) {
    mesh.material.opacity = 0;
  }
  pointLight.intensity = 0;

  scene.add(group);
  resizeRainbowBackdrop(group);
  return group;
}

function resizeSquarePlane(mesh, size) {
  if (Math.abs((mesh.userData.size ?? 0) - size) < 0.1) return;

  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(size, size);
  mesh.userData.size = size;
}

function resizeRainbowBackdrop(target = rainbowBackdrop) {
  if (!target) return;

  const layout = getViewportLayout();
  const baseSize = target.userData.baseSize;
  const innerScale = layout.narrow ? 4.8 : layout.compact ? 5.2 : layout.wide ? 6.4 : RAINBOW_GLOW_SCALE;
  const outerScale = layout.narrow ? 6.6 : layout.compact ? 7.2 : layout.wide ? 9.2 : RAINBOW_OUTER_GLOW_SCALE;

  resizeSquarePlane(target.userData.glowMeshes[0], baseSize * innerScale);
  resizeSquarePlane(target.userData.glowMeshes[1], baseSize * outerScale);
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
  if (prefersReducedMotion.matches) {
    updateRainbowBackdropRotation();
    return;
  }

  rainbowHue = (rainbowHue + 0.003) % 1;
  rainbowBackdrop.userData.pointLight.color.setHSL(rainbowHue, 1, 0.55);
  updateRainbowBackdropRotation();
}

function setCameraOnModel(sectionPos = getCameraAnchorPos()) {
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
  updateHudState();
}

function updateNavbarActive() {
  navSectionButtons.forEach((button) => {
    const sectionIndex = Number(button.dataset.section);
    const isActive = sectionIndex === currentIndex;

    button.classList.toggle("is-active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function updateHudState() {
  document.body.dataset.section = String(currentIndex);
  document.body.removeAttribute("data-trails-ready");

  if (currentIndex !== COMMITTEE_SECTION_INDEX) {
    closeMemberPopup();
  }
}

function restartChalkTrailMotion() {
  if (prefersReducedMotion.matches) return;

  window.requestAnimationFrame(() => {
    document.body.dataset.trailsReady = "true";
    document
      .querySelectorAll(".bee-trail animateMotion")
      .forEach((animation) => animation.beginElement?.());
  });
}

function getCommitteeCards() {
  return COMMITTEE_ROWS.flat();
}

function getPopupViewport() {
  const visual = window.visualViewport;

  return {
    left: visual?.offsetLeft || 0,
    top: visual?.offsetTop || 0,
    width: Math.max(visual?.width || window.innerWidth, 320),
    height: Math.max(visual?.height || window.innerHeight, 240),
  };
}

function getSafeAreaInsets() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => Number.parseFloat(styles.getPropertyValue(name)) || 0;

  return {
    top: read("--safe-top"),
    right: read("--safe-right"),
    bottom: read("--safe-bottom"),
    left: read("--safe-left"),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function projectToScreen(point) {
  point.project(camera);

  return {
    x: canvasRect.left + ((point.x + 1) / 2) * viewportWidth,
    y: canvasRect.top + ((-point.y + 1) / 2) * viewportHeight,
  };
}

function getScreenPoint(object) {
  const point = new THREE.Vector3();
  object.getWorldPosition(point);

  return projectToScreen(point);
}

function getObjectScreenBounds(object) {
  object.updateWorldMatrix(true, false);
  object.geometry.computeBoundingBox();

  const box = object.geometry.boundingBox;
  if (!box) {
    const center = getScreenPoint(object);
    return { center, left: center.x, right: center.x, top: center.y, bottom: center.y };
  }

  const points = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
  ].map((point) => projectToScreen(point.applyMatrix4(object.matrixWorld)));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return {
    left,
    right,
    top,
    bottom,
    center: {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
    },
  };
}

function positionMemberPopup(anchor) {
  if (!memberPopupCard) return;

  const viewport = getPopupViewport();
  const safe = getSafeAreaInsets();
  const rect = {
    width: memberPopupCard.offsetWidth,
    height: memberPopupCard.offsetHeight,
  };
  const pad = 12;
  const gap = 14;
  const minLeft = viewport.left + safe.left + pad;
  const minTop = viewport.top + safe.top + pad;
  const maxLeft = viewport.left + viewport.width - safe.right - rect.width - pad;
  const maxTop = viewport.top + viewport.height - safe.bottom - rect.height - pad;
  let left = anchor.x - rect.width / 2;
  let top = anchor.y - rect.height / 2;

  if (top < minTop || top > maxTop) {
    const above = anchor.y - rect.height - gap;
    const below = anchor.y + gap;
    top = anchor.y > viewport.top + viewport.height / 2 && above >= minTop ? above : below;
  }

  left = clamp(left, minLeft, maxLeft);
  top = clamp(top, minTop, maxTop);

  const originX = clamp(anchor.x - left, 0, rect.width);
  const originY = clamp(anchor.y - top, 0, rect.height);

  memberPopupCard.style.setProperty("--popup-left", `${left}px`);
  memberPopupCard.style.setProperty("--popup-top", `${top}px`);
  memberPopupCard.style.setProperty("--popup-dx", `${anchor.x - left - originX}px`);
  memberPopupCard.style.setProperty("--popup-dy", `${anchor.y - top - originY}px`);
  memberPopupCard.style.setProperty("--popup-origin-x", `${originX}px`);
  memberPopupCard.style.setProperty("--popup-origin-y", `${originY}px`);
}

function refreshMemberPopupPosition() {
  if (!memberPopup || memberPopup.hidden) return;

  const anchor = currentPopupAnchorObject
    ? getObjectScreenBounds(currentPopupAnchorObject).center
    : {
        x: getPopupViewport().left + getPopupViewport().width / 2,
        y: getPopupViewport().top + getPopupViewport().height / 2,
      };

  positionMemberPopup(anchor);
}

function openMemberPopup(index, originObject = null) {
  const member = getCommitteeCards()[index];
  if (!member || !memberPopup) return;
  const origin = originObject
    ? getObjectScreenBounds(originObject).center
    : {
        x: getPopupViewport().left + getPopupViewport().width / 2,
        y: getPopupViewport().top + getPopupViewport().height / 2,
      };

  memberPopupImage.src = member.image;
  memberPopupImage.alt = member.name;
  memberPopupTitle.textContent = member.name;
  memberPopupRole.textContent = member.title;
  memberPopupCopy.textContent = member.shortBio || member.body || "";
  memberPopupLink.href = member.url;
  memberPopupCard?.style.setProperty("--member-accent", member.accentColor);
  memberPopupCard.dataset.microcopy = member.slugline || member.microcopy || member.title;
  currentPopupAnchorObject = originObject;
  memberPopup.classList.remove("is-open");
  memberPopup.hidden = false;
  positionMemberPopup(origin);

  requestAnimationFrame(() => {
    refreshMemberPopupPosition();
    memberPopup.classList.add("is-open");
    memberPopupCard?.focus();
  });
}

function closeMemberPopup() {
  if (!memberPopup || memberPopup.hidden) return;

  memberPopup.classList.remove("is-open");
  currentPopupAnchorObject = null;
  window.setTimeout(() => {
    if (!memberPopup.classList.contains("is-open")) {
      memberPopup.hidden = true;

      if (currentIndex === COMMITTEE_SECTION_INDEX) {
        lastMemberTrigger?.focus?.();
      }
    }
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
}

function setupMemberPopup() {
  memberPopup?.addEventListener("click", (event) => {
    if (event.target.closest("[data-popup-close]")) {
      closeMemberPopup();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMemberPopup();
    }
  });
}

let navCondenseTimer = 0;

function setNavbarCondensed(condensed) {
  if (!navbar) return;

  navbar.classList.toggle("is-condensed", condensed);
}

function scheduleNavbarCondense(delay = 1200) {
  if (coarsePointer.matches) return;

  window.clearTimeout(navCondenseTimer);
  navCondenseTimer = window.setTimeout(() => {
    if (!navbar?.matches(":hover") && !navbar?.contains(document.activeElement)) {
      setNavbarCondensed(true);
    }
  }, delay);
}

function setupNavbarCondense() {
  if (!navbar) return;

  navbar.addEventListener("pointerenter", () => {
    setNavbarCondensed(false);
    window.clearTimeout(navCondenseTimer);
  });

  navbar.addEventListener("pointerleave", () => scheduleNavbarCondense(600));
  navbar.addEventListener("pointerdown", () => setNavbarCondensed(false));
  navbar.addEventListener("focusin", () => {
    setNavbarCondensed(false);
    window.clearTimeout(navCondenseTimer);
  });

  navbar.addEventListener("focusout", (event) => {
    if (!navbar.contains(event.relatedTarget)) {
      scheduleNavbarCondense(700);
    }
  });

  setNavbarCondensed(false);
  scheduleNavbarCondense(1400);
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
      scheduleNavbarCondense(500);
    });
  });

  updateNavbarActive();
  setupNavbarCondense();
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
  textMesh.text = full;
  textMesh.scale.setScalar(prefersReducedMotion.matches ? 1 : 0.94);

  return new Promise((resolve) => {
    textMesh.sync(() => {
      textMesh.userData.textTween = gsap.to(textMesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: prefersReducedMotion.matches ? 0 : TEXT_REVEAL_DURATION,
        ease: "power2.out",
        onComplete: () => {
          textMesh.userData.textTween = null;
          resolve();
        },
      });
    });
  });
}

function hideTextMesh(textMesh, duration = TEXT_HIDE_DURATION) {
  if (!textMesh) return Promise.resolve();

  stopTextAnimation(textMesh);

  return new Promise((resolve) => {
    textMesh.userData.textTween = gsap.to(textMesh.scale, {
      x: prefersReducedMotion.matches ? 1 : 0.96,
      y: prefersReducedMotion.matches ? 1 : 0.96,
      z: prefersReducedMotion.matches ? 1 : 0.96,
      duration: prefersReducedMotion.matches ? 0 : duration,
      ease: "power2.in",
      onComplete: () => {
        textMesh.text = "";
        textMesh.visible = false;
        textMesh.scale.setScalar(1);
        textMesh.sync();
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

  return Promise.all(promises).then((results) => {
    if (index === currentIndex) restartChalkTrailMotion();
    return results;
  });
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
  const layout = getViewportLayout();
  const outText = new Text();

  outText.userData.fullText = section.text;
  outText.text = "";
  outText.font = font;
  outText.fontSize = fontSize;
  outText.color = 0xffffff;
  outText.maxWidth = layout.textMaxWidth;
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

function applyTextMeshLayout(textMesh, section) {
  if (!textMesh) return;

  const layout = getViewportLayout();
  const layoutKey = [
    section.x,
    section.y,
    section.z,
    textMesh.fontSize,
    layout.textMaxWidth,
    section.textAlign ?? "left",
    section.anchorX ?? "left",
  ].join("|");

  if (textMesh.userData.layoutKey === layoutKey) return;

  textMesh.position.set(section.x, section.y, section.z);
  textMesh.textAlign = section.textAlign ?? "left";
  textMesh.anchorX = section.anchorX ?? "left";
  textMesh.maxWidth = layout.textMaxWidth;
  textMesh.userData.layoutKey = layoutKey;
  textMesh.sync();
}

function applySectionTextLayout() {
  const layout = getViewportLayout();

  sectionTexts.forEach((textMesh, index) => {
    textMesh.fontSize = layout.titleFontSize;
    applyTextMeshLayout(
      textMesh,
      getResponsiveSection(TEXT_SECTIONS[index], index, COMPACT_TEXT_LAYOUTS)
    );
  });

  sectionDescriptionTexts.forEach((textMesh, index) => {
    textMesh.fontSize = layout.descriptionFontSize;
    applyTextMeshLayout(
      textMesh,
      getResponsiveSection(
        DESCRIPTION_SECTIONS[index],
        index,
        COMPACT_DESCRIPTION_LAYOUTS
      )
    );
  });
}

function resizePlane(mesh, height) {
  if (!mesh?.userData.aspect) return;

  const width = height * mesh.userData.aspect;
  if (
    Math.abs((mesh.userData.width ?? 0) - width) < 0.01 &&
    Math.abs((mesh.userData.height ?? 0) - height) < 0.01
  ) {
    return;
  }

  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(width, height);
  mesh.userData.width = width;
  mesh.userData.height = height;
}

function resizeAvatarPlane(mesh, size) {
  if (
    Math.abs((mesh.userData.width ?? 0) - size) < 0.01 &&
    Math.abs((mesh.userData.height ?? 0) - size) < 0.01
  ) {
    return;
  }

  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(size, size);
  mesh.userData.width = size;
  mesh.userData.height = size;
}

function applySponsorImageLayout() {
  if (!sponsorImage) return;

  const layout = getViewportLayout();
  sponsorImage.position.set(SPONSOR_IMAGE_POS.x, layout.sponsorImageY, SPONSOR_IMAGE_POS.z);
  resizePlane(sponsorImage, layout.sponsorImageHeight);
}

function applyAboutJoinImageLayout() {
  if (!aboutJoinImage) return;

  const layout = getViewportLayout();
  aboutJoinImage.position.set(ABOUT_IMAGE_POS.x, layout.aboutImageY, ABOUT_IMAGE_POS.z);
  aboutJoinImage.userData.baseY = layout.aboutImageY;
  resizePlane(aboutJoinImage, layout.aboutImageHeight);
}

function applyResponsiveLayout() {
  applySectionTextLayout();
  applySponsorImageLayout();
  applyAboutJoinImageLayout();
  applyCommitteeLayout();
  applySocialCubeLayout();
  resizeRainbowBackdrop();
  pointerDirty = true;
}

function createSponsorImage() {
  const sponsorDescription = SPONSOR_IMAGE_POS;
  const material = createRoundedImageMaterial();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  mesh.position.set(
    sponsorDescription.x,
    sponsorDescription.y + SPONSOR_IMAGE_Y_OFFSET,
    sponsorDescription.z
  );
  mesh.visible = false;
  scene.add(mesh);

  textureLoader.load(NUAXION_LOGO_PATH, (texture) => {
    material.map = polishTexture(texture);
    material.needsUpdate = true;

    mesh.userData.aspect = texture.image.width / texture.image.height;
    applySponsorImageLayout();
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
  const material = createRoundedImageMaterial();
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
    material.map = polishTexture(texture);
    material.needsUpdate = true;

    mesh.userData.aspect = texture.image.width / texture.image.height;
    applyAboutJoinImageLayout();
  });

  return mesh;
}

function stopAboutJoinImageFade() {
  if (!aboutJoinImage) return;

  gsap.killTweensOf(aboutJoinImage.material);
}

function stopAboutJoinHover() {
  if (!aboutJoinImage) return;

  gsap.killTweensOf(aboutJoinImage.position);
  gsap.killTweensOf(aboutJoinImage.scale);
  aboutJoinImage.userData.hovered = false;
  aboutJoinImage.userData.tiltZ = 0;
  aboutJoinImage.scale.set(1, 1, 1);
  aboutJoinImage.position.y = aboutJoinImage.userData.baseY ?? aboutJoinImage.position.y;
  document.body.removeAttribute("data-content-hover");
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
  stopAboutJoinHover();

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
  setAboutJoinImageHovered(intersects.length > 0);

  canvas.style.cursor = intersects.length > 0 ? "pointer" : "default";
}

function setAboutJoinImageHovered(hovered) {
  if (!aboutJoinImage || aboutJoinImage.userData.hovered === hovered) return;

  gsap.killTweensOf(aboutJoinImage.position);
  gsap.killTweensOf(aboutJoinImage.scale);
  aboutJoinImage.userData.hovered = hovered;
  const baseY = aboutJoinImage.userData.baseY ?? aboutJoinImage.position.y;

  if (hovered) {
    window.clearTimeout(rubricMoodTimer);
    document.body.removeAttribute("data-rubric-mood");
    document.body.dataset.contentHover = "join";
    gsap.to(aboutJoinImage.scale, {
      x: 1.06,
      y: 1.06,
      z: 1.06,
      duration: motionDuration(0.12),
      ease: "back.out(2)",
    });
    gsap.to(aboutJoinImage.position, {
      y: baseY + 0.22,
      duration: motionDuration(0.28),
      ease: "sine.inOut",
      yoyo: true,
      repeat: prefersReducedMotion.matches ? 0 : -1,
    });
  } else {
    document.body.removeAttribute("data-content-hover");
    window.clearTimeout(rubricMoodTimer);
    document.body.dataset.rubricMood = "sad";
    rubricMoodTimer = window.setTimeout(
      () => document.body.removeAttribute("data-rubric-mood"),
      prefersReducedMotion.matches ? 650 : 820
    );
    aboutJoinImage.userData.tiltZ = -0.12;
    gsap.to(aboutJoinImage.scale, {
      x: 1.08,
      y: 0.92,
      z: 1,
      duration: motionDuration(0.12),
      ease: "power2.out",
      onComplete: () => {
        aboutJoinImage.userData.tiltZ = 0;
        gsap.to(aboutJoinImage.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: motionDuration(0.16),
          ease: "back.out(1.7)",
        });
      },
    });
    gsap.to(aboutJoinImage.position, {
      y: baseY - 0.16,
      duration: motionDuration(0.12),
      ease: "power2.in",
      onComplete: () => {
        gsap.to(aboutJoinImage.position, {
          y: baseY,
          duration: motionDuration(0.16),
          ease: "back.out(1.7)",
        });
      },
    });
  }
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

    updatePointerFromEvent(event);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(aboutJoinImage);

    if (intersects.length > 0) {
      window.open(aboutJoinImage.userData.url, "_blank", "noopener,noreferrer");
    }
  });
}

function getCommitteeMemberPosition(rowIndex, colIndex, rowLength, memberIndex = 0) {
  const layout = getViewportLayout();
  let xOffset;
  let y;

  if (layout.committeeMobileRows) {
    let row = 0;
    let firstIndex = 0;

    while (
      row < layout.committeeMobileRows.length - 1 &&
      memberIndex >= firstIndex + layout.committeeMobileRows[row]
    ) {
      firstIndex += layout.committeeMobileRows[row];
      row += 1;
    }

    const rowLengthForIndex = layout.committeeMobileRows[row];
    const col = memberIndex - firstIndex;

    xOffset = (col - (rowLengthForIndex - 1) / 2) * layout.committeeImageSpacing;
    y = layout.committeeBaseY - row * layout.committeeRowSpacing;
  } else {
    xOffset = (colIndex - (rowLength - 1) / 2) * layout.committeeImageSpacing;
    y = layout.committeeBaseY - rowIndex * layout.committeeRowSpacing;
  }

  return {
    x: COMMITTEE_BASE_POSITION.x + xOffset,
    y,
    z: COMMITTEE_BASE_POSITION.z,
  };
}

function createCommitteeCaption(title, position, imageHeight) {
  const caption = new Text();
  const layout = getViewportLayout();

  caption.text = title;
  caption.font = DESCRIPTION_FONT;
  caption.fontSize = layout.committeeCaptionFontSize;
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
  const members = [];
  let memberIndex = 0;

  COMMITTEE_ROWS.forEach((row, rowIndex) => {
    row.forEach((config, colIndex) => {
      const position = getCommitteeMemberPosition(
        rowIndex,
        colIndex,
        row.length,
        memberIndex
      );
      const material = createRoundedImageMaterial();
      const image = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

      image.position.set(position.x, position.y, position.z);
      image.userData.url = config.url;
      image.userData.name = config.name;
      image.userData.title = config.title;
      image.userData.image = config.image;
      image.userData.accentColor = config.accentColor;
      image.userData.pathVariant = config.pathVariant;
      image.userData.memberIndex = memberIndex;
      image.userData.texturePath = config.image;
      image.userData.layout = { rowIndex, colIndex, rowLength: row.length, memberIndex };
      image.userData.fadeTween = null;
      image.visible = false;
      scene.add(image);

      const caption = createCommitteeCaption(
        config.title,
        position,
        getViewportLayout().committeeImageHeight
      );
      caption.userData.layout = image.userData.layout;
      caption.userData.fadeTween = null;
      caption.userData.baseColor = 0xffffff;
      image.userData.caption = caption;

      members.push({
        image,
        caption,
        url: config.url,
        name: config.name,
        title: config.title,
        slugline: config.slugline,
        shortBio: config.shortBio,
        body: config.body,
        microcopy: config.microcopy,
        accentColor: config.accentColor,
        pathVariant: config.pathVariant,
        sourceImage: config.image,
        rowIndex,
        colIndex,
        rowLength: row.length,
        memberIndex,
      });
      memberIndex += 1;
    });
  });

  return members;
}

function applyCommitteeLayout() {
  const layout = getViewportLayout();

  committeeMembers.forEach((member) => {
    const position = getCommitteeMemberPosition(
      member.rowIndex,
      member.colIndex,
      member.rowLength,
      member.memberIndex
    );

    member.image.position.set(position.x, position.y, position.z);
    resizeAvatarPlane(member.image, layout.committeeImageHeight);

    member.caption.fontSize = layout.committeeCaptionFontSize;
    member.caption.position.set(
      position.x,
      position.y - layout.committeeImageHeight / 2 - COMMITTEE_CAPTION_GAP,
      position.z
    );
    member.caption.sync();
  });
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

function loadCommitteeMemberTexture(member) {
  if (member.image.material.map) return Promise.resolve();
  if (member.image.userData.texturePromise) {
    return member.image.userData.texturePromise;
  }

  member.image.userData.texturePromise = new Promise((resolve, reject) => {
    textureLoader.load(
      member.image.userData.texturePath,
      (texture) => {
        member.image.material.map = polishTexture(texture);
        member.image.material.needsUpdate = true;
        member.image.userData.aspect = texture.image.width / texture.image.height;
        coverSquareTexture(texture, member.image.userData.aspect);
        applyCommitteeLayout();
        resolve();
      },
      undefined,
      reject
    );
  });

  return member.image.userData.texturePromise;
}

async function revealCommitteeMembers() {
  if (committeeMembers.length === 0) return Promise.resolve();

  await Promise.allSettled(committeeMembers.map(loadCommitteeMemberTexture));

  return Promise.all(
    committeeMembers.map((member) => {
      stopCommitteeMemberFade(member);
      member.image.visible = true;
      member.caption.visible = true;
      member.caption.fillOpacity = 1;
      member.caption.sync();

      return new Promise((resolve) => {
        member.image.userData.fadeTween = gsap.to(member.image.material, {
          opacity: 1,
          duration: TEXT_REVEAL_DURATION,
          ease: "power2.out",
          onComplete: () => {
            member.image.userData.fadeTween = null;
            resolve();
          },
        });
      });
    })
  );
}

function hideCommitteeMembers() {
  if (committeeMembers.length === 0) return Promise.resolve();

  setCommitteeImageHovered(null);

  return Promise.all(
    committeeMembers.map((member) => {
      stopCommitteeMemberFade(member);

      member.caption.fillOpacity = 0;
      member.caption.visible = false;
      member.caption.sync();

      return new Promise((resolve) => {
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
      });
    })
  );
}

function getVisibleCommitteeImages() {
  return committeeMembers
    .map((member) => member.image)
    .filter((image) => image.visible);
}

function setCommitteeImageHovered(image) {
  if (hoveredCommitteeImage === image) return;

  if (hoveredCommitteeImage) {
    gsap.killTweensOf(hoveredCommitteeImage.position, "z");
    gsap.killTweensOf(hoveredCommitteeImage.scale);
    hoveredCommitteeImage.userData.caption.color = 0xffffff;
    hoveredCommitteeImage.userData.caption.sync();
    gsap.to(hoveredCommitteeImage.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: motionDuration(0.16),
      ease: "power2.out",
    });
    gsap.to(hoveredCommitteeImage.position, {
      z: COMMITTEE_BASE_POSITION.z,
      duration: motionDuration(0.16),
      ease: "power2.out",
    });
  }

  hoveredCommitteeImage = image;
  document.body.style.removeProperty("--committee-accent");
  document.body.removeAttribute("data-committee-group");
  document.body.removeAttribute("data-path-variant");

  if (hoveredCommitteeImage) {
    const accent = hoveredCommitteeImage.userData.accentColor || "#FF5757";
    document.body.style.setProperty("--committee-accent", accent);
    document.body.dataset.committeeGroup =
      hoveredCommitteeImage.userData.layout.rowIndex === 0 ? "role" : "content";
    document.body.dataset.pathVariant =
      hoveredCommitteeImage.userData.pathVariant || "underline-swoop";
    hoveredCommitteeImage.userData.caption.color = accent;
    hoveredCommitteeImage.userData.caption.sync();
    gsap.killTweensOf(hoveredCommitteeImage.position, "z");
    gsap.killTweensOf(hoveredCommitteeImage.scale);
    gsap.to(hoveredCommitteeImage.scale, {
      x: 1.04,
      y: 1.04,
      z: 1.04,
      duration: motionDuration(0.16),
      ease: "power2.out",
    });
    gsap.to(hoveredCommitteeImage.position, {
      z: COMMITTEE_BASE_POSITION.z + 1,
      duration: motionDuration(0.16),
      ease: "power2.out",
    });
  }
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
  if (visibleImages.length === 0) {
    setCommitteeImageHovered(null);
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(visibleImages);

  setCommitteeImageHovered(intersects[0]?.object ?? null);
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

    updatePointerFromEvent(event);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getVisibleCommitteeImages());

    if (intersects.length > 0) {
      lastMemberTrigger = canvas;
      openMemberPopup(intersects[0].object.userData.memberIndex, intersects[0].object);
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

function getSocialCubeBasePosition(index) {
  const layout = getViewportLayout();
  const xOffset = (index - (SOCIAL_CUBES.length - 1) / 2) * layout.socialCubeSpacing;

  return {
    x: SOCIAL_CUBE_BASE.x + xOffset,
    y: layout.socialCubeY,
    z: SOCIAL_CUBE_BASE.z,
  };
}

function resizeSocialCard(card) {
  const layout = getViewportLayout();

  if (
    Math.abs((card.userData.width ?? 0) - layout.socialCardWidth) < 0.01 &&
    Math.abs((card.userData.height ?? 0) - layout.socialCardHeight) < 0.01
  ) {
    return;
  }

  card.geometry.dispose();
  card.geometry = new THREE.BoxGeometry(
    layout.socialCardWidth,
    layout.socialCardHeight,
    SOCIAL_CARD_DEPTH
  );
  card.userData.width = layout.socialCardWidth;
  card.userData.height = layout.socialCardHeight;

  if (card.userData.caption) {
    card.userData.caption.fontSize = layout.narrow ? 0.5 : layout.compact ? 0.56 : 0.64;
    card.userData.caption.position.set(
      0,
      -layout.socialCardHeight / 2 - 0.42,
      SOCIAL_CARD_DEPTH / 2 + 0.04
    );
    card.userData.caption.sync();
  }
}

function applySocialCubeLayout() {
  socialCubes.forEach((cube) => {
    const basePosition = getSocialCubeBasePosition(cube.userData.socialIndex);

    cube.userData.baseX = basePosition.x;
    cube.userData.baseY = basePosition.y;
    resizeSocialCard(cube);

    if (!cube.userData.entranceTween && !cube.userData.exitTween) {
      cube.position.set(basePosition.x, basePosition.y, basePosition.z);
    }
  });
}

function createSocialCaption(label) {
  const layout = getViewportLayout();
  const caption = new Text();

  caption.text = label;
  caption.font = DESCRIPTION_FONT;
  caption.fontSize = layout.narrow ? 0.5 : layout.compact ? 0.56 : 0.64;
  caption.color = 0xffffff;
  caption.anchorX = "center";
  caption.anchorY = "top";
  caption.textAlign = "center";
  caption.position.set(0, -layout.socialCardHeight / 2 - 0.42, SOCIAL_CARD_DEPTH / 2 + 0.04);
  caption.sync();

  return caption;
}

function createSocialCubes() {
  return SOCIAL_CUBES.map((config, index) => {
    const texture = createSocialTexture(config);
    const basePosition = getSocialCubeBasePosition(index);
    const layout = getViewportLayout();
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(layout.socialCardWidth, layout.socialCardHeight, SOCIAL_CARD_DEPTH),
      createSocialCardMaterials(texture)
    );
    const caption = createSocialCaption(config.label);

    cube.position.set(basePosition.x, basePosition.y, basePosition.z);
    cube.userData.url = config.url;
    cube.userData.accent = config.accent;
    cube.userData.socialIndex = index;
    cube.userData.width = layout.socialCardWidth;
    cube.userData.height = layout.socialCardHeight;
    cube.userData.caption = caption;
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
    cube.add(caption);
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
  if (prefersReducedMotion.matches) return;

  cube.userData.floatTween = gsap.to(cube.position, {
    y: cube.userData.baseY + SOCIAL_CUBE_FLOAT_DISTANCE,
    duration: SOCIAL_CUBE_FLOAT_DURATION + delay,
    delay,
    ease: "power2.out",
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      cube.userData.floatTween = null;
      cube.position.y = cube.userData.baseY;
    },
  });
}

function stopSocialCubeGrow(cube) {
  if (cube.userData.growTween) {
    cube.userData.growTween.kill();
    cube.userData.growTween = null;
  }

  gsap.killTweensOf(cube.position, "z");
}

function setSocialCubeHovered(cube, hovered) {
  stopSocialCubeGrow(cube);

  if (hovered) {
    cube.userData.growTween = gsap.to(cube.scale, {
      x: SOCIAL_CUBE_SCALE_MAX,
      y: SOCIAL_CUBE_SCALE_MAX,
      z: SOCIAL_CUBE_SCALE_MAX,
      duration: 0.18,
      ease: "power2.out",
    });
    gsap.to(cube.position, {
      z: SOCIAL_CUBE_BASE.z + 1.1,
      duration: 0.18,
      ease: "power2.out",
    });
  } else {
    gsap.to(cube.scale, {
      x: SOCIAL_CUBE_SCALE_MIN,
      y: SOCIAL_CUBE_SCALE_MIN,
      z: SOCIAL_CUBE_SCALE_MIN,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(cube.position, {
      z: SOCIAL_CUBE_BASE.z,
      duration: 0.22,
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
  document.body.removeAttribute("data-content-hover");

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
  pointerDirty = true;

  if (visible) {
    startSocialCubeEntrance();
  } else {
    stopSocialCubeAnimations();
    canvas.style.cursor = "default";
    document.body.removeAttribute("data-content-hover");
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
      document.body.dataset.contentHover = "social";
      document.body.style.setProperty("--content-accent", cube.userData.accent || "#ff5757");

      if (!cube.userData.hovered) {
        setSocialCubeHovered(cube, true);
      }
    } else if (cube.userData.hovered) {
      resetSocialCubeHover(cube);
    }
  });

  if (!pointerActive) {
    document.body.removeAttribute("data-content-hover");
    document.body.style.removeProperty("--content-accent");
  }

  canvas.style.cursor = pointerActive ? "pointer" : "default";
}

function setupSocialCubeInteraction() {
  canvas.addEventListener("pointermove", updatePointerFromEvent, { passive: true });
  canvas.addEventListener("pointerdown", updatePointerFromEvent, { passive: true });

  window.addEventListener("click", (event) => {
    if (
      currentIndex !== CONTACT_SECTION_INDEX ||
      isAnimating ||
      !socialCubes.some((cube) => cube.visible)
    ) {
      return;
    }

    updatePointerFromEvent(event);
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
  setNavbarCondensed(false);
  scheduleNavbarCondense(900);

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
  pointerDirty = true;
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
  scrollObserver = Observer.create({
    target: window,
    type: "wheel,touch",
    preventDefault: true,
    ignore: ".member-popup, .member-popup *",
    onDown: () => goToNextSection(),
    onUp: () => goToPrevSection(),
    tolerance: SCROLL_TOLERANCE,
  });
}

function setupKeyboardNavigation() {
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const tagName = event.target?.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
      return;
    }

    const actions = {
      ArrowDown: goToNextSection,
      ArrowRight: goToNextSection,
      PageDown: goToNextSection,
      ArrowUp: goToPrevSection,
      ArrowLeft: goToPrevSection,
      PageUp: goToPrevSection,
      Home: () => goToSection(0),
      End: () => goToSection(MODEL_SECTIONS.length - 1),
    };
    const action = actions[event.key];

    if (!action) return;

    event.preventDefault();
    action();
  });
}

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
      pointerDirty = true;
      logModelPosition("Model (entrance complete)");
    },
  });
}

function polishLogoModel(root) {
  const logoMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5757,
    roughness: 0.46,
    metalness: 0.12,
    emissive: 0x260505,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });

  root.traverse((child) => {
    if (child.isMesh) {
      child.material = logoMaterial;
      child.geometry.computeVertexNormals();
    }
  });
}

function loadSceneModel() {
  loader.load(
    MODEL_PATH,
    (gltf) => {
      modelGroup = new THREE.Group();

      polishLogoModel(gltf.scene);
      modelGroup.add(gltf.scene);
      modelGroup.scale.setScalar(MODEL_SCALE);
      scene.add(modelGroup);

      applyModelRotation();

      const box = new THREE.Box3().setFromObject(modelGroup);
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);

      modelLookHeight = size.y * 0.35;
      baseCamLeftOffset = maxSize * CAM_LEFT_FACTOR;
      baseCamHeightOffset = maxSize * CAM_HEIGHT_FACTOR;
      baseCameraZ = maxSize * CAM_DISTANCE_FACTOR;
      camera.near = Math.max(maxSize / 100, 0.01);
      camera.far = Math.max(maxSize * 100, CAM_FAR);
      applyCameraLayout();

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
}

let resizeFrame = 0;

function onResize() {
  updateViewportSize();
  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(viewportWidth, viewportHeight, false);
  applyCameraLayout();
  applyResponsiveLayout();
  refreshMemberPopupPosition();
}

function queueResize() {
  if (resizeFrame) return;

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    onResize();
  });
}

window.addEventListener("resize", queueResize, { passive: true });
window.visualViewport?.addEventListener("resize", queueResize, { passive: true });
window.visualViewport?.addEventListener("scroll", refreshMemberPopupPosition, { passive: true });

if ("ResizeObserver" in window) {
  resizeObserver = new ResizeObserver(queueResize);
  resizeObserver.observe(canvas);
}

function animate() {
  animationFrame = requestAnimationFrame(animate);

  animateRainbowBackdrop();
  applyPointerMotion();

  if (pointerDirty) {
    updateSocialCubeHover();
    updateAboutJoinHover();
    updateCommitteeHover();
    pointerDirty = false;
  }

  if (ENABLE_ORBIT_CONTROLS && controls) {
    controls.update();
  }

  if (ENABLE_LIGHT_DEBUG) {
    lightHelpers.forEach((helper) => helper.update());
  }

  renderer.render(scene, camera);
}

function startAnimationLoop() {
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function stopAnimationLoop() {
  if (!animationFrame) return;

  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimationLoop();
  } else {
    pointerDirty = true;
    startAnimationLoop();
  }
});

window.addEventListener("pagehide", () => {
  stopAnimationLoop();
  scrollObserver?.kill();
  resizeObserver?.disconnect();

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = 0;
  }
});

async function init() {
  COMMITTEE_ROWS = await loadCommitteeRows();
  setupScrollControl();
  setupKeyboardNavigation();
  initSectionTexts();
  sponsorImage = createSponsorImage();
  aboutJoinImage = createAboutJoinImage();
  committeeMembers = createCommitteeMembers();
  setupNavbar();
  setupMemberPopup();
  socialCubes = createSocialCubes();
  applyResponsiveLayout();
  setupSocialCubeInteraction();
  setupAboutJoinInteraction();
  setupCommitteeInteraction();
  loadSceneModel();

  if (!document.hidden) {
    startAnimationLoop();
  }
}

init().catch((error) => {
  console.error("Failed to start site:", error);
  if (DEBUG && statusLabel) {
    statusLabel.hidden = false;
    statusLabel.textContent = "Failed to load";
  }
});
