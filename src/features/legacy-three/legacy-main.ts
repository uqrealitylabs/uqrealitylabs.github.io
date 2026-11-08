// @ts-nocheck
import { gsap } from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Text } from "troika-three-text";
import { getPageContent, getSiteContent } from "../../content/contentRegistry";
import { BLOG_LINK, PROSPECTUS_LINK } from "../../shared/links";
import {
  getSocialMaterialConfig,
  getSocialMaterialKind,
} from "../social-materials/materialConfig";
import {
  applyPoke,
  createPokeState,
  getPokeVelocity,
  stepPoke,
} from "../social-materials/socialPokeModel";

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
const CAM_DISTANCE_FACTOR = 0.2;
const CAM_LEFT_FACTOR = 0.0;
const CAM_HEIGHT_FACTOR = 0.05;

const STAR_COUNT = 500;
const STAR_RADIUS = 0.16;
const SECTION_Y_STEP = 200;
const SECTION_Y_SPAN = 24;
const SECTION_Z_SPAN = 12;
const STAR_SCROLL_STEP = 80;
const SECTION_SHRINK = 0.7;
const TEXT_FONT_SIZE = 1.84;
const DESCRIPTION_Y_OFFSET = -5;
const DESCRIPTION_FONT_SIZE = 1.12;
const COMPACT_VIEWPORT_WIDTH = 860;
const SHORT_VIEWPORT_HEIGHT = 680;
// Mobile-only tightening: descriptions sit closer to their titles and render
// smaller, along with the committee avatars and sponsor logo.
const COMPACT_DESCRIPTION_SCALE = 0.75;
const COMPACT_ICON_SCALE = 0.75;
const POINTER_IDLE_MS = 1200;
const POINTER_DAMPING = 0.12;
const REDUCED_POINTER_DAMPING = 0.025;
const CAMERA_ANCHOR_SECTION_INDEX = 0;

const ASSET_BASE = "/";
const TITLE_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Medium.ttf`;
const DESCRIPTION_FONT = `${ASSET_BASE}Assets/fonts/Bitcount_Single/static/BitcountSingle_Roman-Regular.ttf`;
const MODEL_PATH = `${ASSET_BASE}Assets/test-two.glb`;
const LABS_LOGO_PATH = `${ASSET_BASE}Assets/images/labs_logo.png`;

const TAB_ORDER = ["home", "about", "contact", "sponsors", "committee"];

function compactContentText(text = "") {
  return text
    .trim()
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");
}

function withBasePath(path = "") {
  const normalized = path.replace(/^\/+/, "");
  if (!normalized.startsWith("Assets/") || normalized.includes("..")) {
    return `${ASSET_BASE}Assets/images/labs_logo.png`;
  }
  return `${ASSET_BASE}${normalized}`;
}

function currentLocale() {
  return document.documentElement.lang || "en";
}

function blockText(block) {
  if (!block) return "";
  if (block.type === "paragraph" || block.type === "heading") return block.text;
  if (block.type === "list") return (block.items || []).join("\n");
  if (block.type === "quote") return block.text;
  return "";
}

function pageDescription(page) {
  const heroText = (page.hero?.body || []).map(blockText).join("\n");
  const sectionText = (page.sections || [])
    .flatMap((section) => section.blocks || [])
    .map(blockText)
    .join("\n");
  return compactContentText(heroText || sectionText || page.meta.description);
}

async function loadTab(slug) {
  const page = getPageContent(currentLocale(), slug);
  const theme = page.theme || {};

  return {
    slug,
    label: page.nav?.label || page.meta.title || slug,
    shortLabel: page.nav?.shortLabel || page.nav?.label || page.meta.title,
    title: compactContentText(page.hero?.title || page.meta.title || slug),
    description: pageDescription(page),
    links: page.links || {},
    joinLabel: page.hero?.cta?.label || "",
    slugline: page.hero?.slugline || "",
    accentColor: theme.accentColor || "#FF5757",
    trailColor: theme.trailColor || theme.accentColor || "#FF5757",
    pathVariant: theme.pathVariant || "underline-swoop",
    order: Number.isFinite(page.nav?.order)
      ? page.nav.order
      : TAB_ORDER.indexOf(slug) + 1,
  };
}

async function loadSocialContent() {
  const socials = getSiteContent(currentLocale()).socialLinks || [];

  return socials
    .map((social, index) => ({
      label: social.label,
      url: social.url,
      texture: withBasePath(social.texture),
      material: social.material || null,
      accent: social.accent || social.accentColor || "#FF5757",
      music: social.music || null,
      order: Number.isFinite(social.order) ? social.order : index + 1,
    }))
    .sort((a, b) => a.order - b.order);
}

function committeeMember(entry, role, roleSlug) {
  return {
    image: withBasePath(entry.photo),
    url: entry.linkedin || LINKEDIN_LINK,
    name: entry.name,
    title: entry.role || role?.role || roleSlug,
    shortBio: entry.shortBio,
    body: entry.bio || "",
    slugline: role?.slugline || "",
    accentColor: entry.accentColor || role?.accentColor || "#FF5757",
    trailColor: role?.trailColor || role?.accentColor || "#FF5757",
    pathVariant: entry.pathVariant || role?.pathVariant || "underline-swoop",
    music: entry.music || role?.music || null,
    order: Number.isFinite(entry.order) ? entry.order : 0,
    roleSlug,
    photoFocus: entry.photoFocus || "50% 50%",
    photoWidth: entry.photoWidth,
    photoHeight: entry.photoHeight,
  };
}

async function loadCommitteeYears() {
  const site = getSiteContent(currentLocale());
  const manifest = site.committee || {};
  const generalRole = manifest.generalRole || "general";
  const roleSlugs = manifest.roles || [
    ...new Set((manifest.rows || []).flat()),
  ];

  return (manifest.years || []).map((yearEntry) => {
    const execRows = (manifest.rows || [])
      .map((row) =>
        row
          .map((slug) => {
            const entry = yearEntry.members?.[slug];
            if (!entry) return null;
            const role = site.roles?.[slug];
            return committeeMember(entry, role, role?.slug || slug);
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order),
      )
      .filter((row) => row.length > 0);

    const generalRoleContent = site.roles?.[generalRole];
    const general = (yearEntry.general || [])
      .map((entry, index) => ({
        ...committeeMember(entry, generalRoleContent, generalRole),
        order: Number.isFinite(entry.order) ? entry.order : index,
      }))
      .sort((a, b) => a.order - b.order);

    if (roleSlugs.length === 0) return null;

    return { year: yearEntry.year, execRows, general };
  }).filter(Boolean);
}

function buildCommitteeGroups(years) {
  const groups = [];

  years.forEach((entry) => {
    if (entry.execRows.length > 0) {
      groups.push({ year: entry.year, kind: "exec", rows: entry.execRows });
    }
    if (entry.general.length > 0) {
      groups.push({
        year: entry.year,
        kind: "general",
        rows: [entry.general],
      });
    }
  });

  return groups;
}

let TABS = [];
let SECTION_INDEX = {};
let ABOUT_SECTION_INDEX = 0;
const RUBRIC_IMAGE_PATH = `${ASSET_BASE}Assets/images/rubric.png`;
const PROSPECTUS_IMAGE_PATH = `${ASSET_BASE}Assets/images/prospectus.jpg`;
const BLOG_IMAGE_PATH = `${ASSET_BASE}Assets/images/blog.png`;
const ABOUT_IMAGE_Y_OFFSET = -2;
const ABOUT_IMAGE_HEIGHT = 5.2;
const ABOUT_ICON_GAP = 0.7;
let JOIN_LINK = "";
let JOIN_LABEL = "";
const NUAXION_LOGO_PATH = `${ASSET_BASE}Assets/images/nuaxion_logo.avif`;
let SPONSOR_SECTION_INDEX = 0;
const SPONSOR_IMAGE_Y_OFFSET = -5;
const SPONSOR_IMAGE_HEIGHT = 6.3;

let COMMITTEE_SECTION_INDEX = 0;
const COMMITTEE_BASE_POSITION = { x: 0, y: 4, z: -25 };
const COMMITTEE_IMAGE_HEIGHT = 5.6;
const COMMITTEE_IMAGE_SPACING = 11.4;
const COMMITTEE_ROW_SPACING = 8.9;
const COMMITTEE_CAPTION_GAP = 0.5;
const COMMITTEE_CAPTION_FONT_SIZE = 0.85;
let COMMITTEE_GROUPS = [];

const INSTAGRAM_LINK = "https://www.instagram.com/uqrealitylabs/";
const LINKEDIN_LINK = "https://www.linkedin.com/company/uq-reality-labs";
const DISCORD_LINK = "https://discord.com/invite/eN6v8R3fYD";
const EMAIL_LINK = "mailto:uqrealitylabs@gmail.com";

let CONTACT_SECTION_INDEX = 0;
const SOCIAL_CUBE_SPACING = 6;
const SOCIAL_CUBE_RADIUS = 0.18;
const SOCIAL_CUBE_SEGMENTS = 18;
const SOCIAL_CUBE_BASE = {
  x: 0,
  y: 4 + DESCRIPTION_Y_OFFSET,
  z: -20,
};
const SOCIAL_CUBE_SCALE_MIN = 1;
const SOCIAL_CUBE_SCALE_MAX = 1.08;
const SOCIAL_CARD_DEPTH = 0.42;
const SOCIAL_TOUCH_TEXTURE_SIZE = 256;
let SOCIAL_CUBES = [];

// scroll down moves to the next section (model shifts down on Y)
let MODEL_SECTIONS = [];

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
  {
    x: 0,
    y: 13 + DESCRIPTION_Y_OFFSET,
    z: -20,
    textAlign: "center",
    anchorX: "center",
  },
  { x: -15, y: 10 + DESCRIPTION_Y_OFFSET, z: -20 },
  { x: -16, y: 12 + DESCRIPTION_Y_OFFSET, z: -20 },
  { x: -15, y: 13 + DESCRIPTION_Y_OFFSET, z: -20 },
];

let TEXT_SECTIONS = [];
let DESCRIPTION_SECTIONS = [];

async function loadSiteContent() {
  TABS = await Promise.all(TAB_ORDER.map(loadTab));
  SECTION_INDEX = Object.fromEntries(
    TABS.map((tab, index) => [tab.slug, index]),
  );
  ABOUT_SECTION_INDEX = SECTION_INDEX.about;
  JOIN_LINK = TABS[ABOUT_SECTION_INDEX].links.join;
  JOIN_LABEL = TABS[ABOUT_SECTION_INDEX].joinLabel;
  SPONSOR_SECTION_INDEX = SECTION_INDEX.sponsors;
  COMMITTEE_SECTION_INDEX = SECTION_INDEX.committee;
  CONTACT_SECTION_INDEX = SECTION_INDEX.contact;
  MODEL_SECTIONS = TABS.map((tab, index) => ({
    x: 0,
    y: -SECTION_Y_STEP * index,
    z: -20,
    label: tab.label,
  }));
  TEXT_SECTIONS = TABS.map((tab, index) => ({
    ...TEXT_LAYOUTS[index],
    text: tab.title,
  }));
  DESCRIPTION_SECTIONS = TABS.map((tab, index) => ({
    ...DESCRIPTION_LAYOUTS[index],
    text: tab.description,
  }));

  SOCIAL_CUBES = await loadSocialContent();
}

function setupAccessibleContentLinks() {
  if (joinUsAccessibleLink && JOIN_LINK) {
    joinUsAccessibleLink.href = JOIN_LINK;
    joinUsAccessibleLink.textContent = JOIN_LABEL || JOIN_LINK;
  }

  if (!socialAccessibleLinks) return;
  socialAccessibleLinks.replaceChildren(
    ...SOCIAL_CUBES.map((social) => {
      const link = document.createElement("a");
      link.href = social.url;
      link.textContent = social.label;
      link.rel = "noopener noreferrer";
      return link;
    }),
  );
}

const SPONSOR_IMAGE_POS = { x: 0, y: 5, z: -20 };
const ABOUT_IMAGE_POS = { x: 0, y: 0, z: -18.75 };

// UQRL model thing
const MODEL_SCALE = 0.1;
const MODEL_ROTATION = { x: -20, y: 160, z: 180 }; // degrees
const MODEL_ENTRANCE_DURATION = 1.5;
const MODEL_ENTRANCE_EASE = "power3.out";
const MODEL_ENTRANCE_OFFSET_FACTOR = 200; // distance below final position (× model size)
const MODEL_PARALLAX_X = 0.35; // horizontal cursor parallax (× model size)
const MODEL_PARALLAX_Y = 0.2; // vertical cursor parallax (× model size)

// light offsets relative to model center (camera views from +Z)
const KEY_LIGHT_OFFSET = { x: 2, y: 10, z: 40 };
const FILL_LIGHT_OFFSET = { x: -12, y: 4, z: 25 };
const RAINBOW_Z_OFFSET = -80; // behind model (home model z -20 → light z -100)
const RAINBOW_GLOW_SCALE = 11.8;
const RAINBOW_OUTER_GLOW_SCALE = 17.6;
const RAINBOW_LIGHT_INTENSITY = 3.1;
const RAINBOW_LIGHT_DISTANCE = 114;
const RAINBOW_LIGHT_DECAY = 0.62;

const canvas = document.querySelector("#canvas");
const statusLabel = document.querySelector("#status");
const navbar = document.querySelector("#navbar");
const navLogoImage = document.querySelector("#nav-logo-img");
const navLinks = document.querySelector("#nav-links");
const joinUsAccessibleLink = document.querySelector("#join-us-accessible-link");
const socialAccessibleLinks = document.querySelector("#social-accessible-links");
const scrollTrack = document.querySelector("#scroll-track");
const yearRail = document.querySelector("#year-rail");
let yearRailButtons = [];
let navSectionButtons = [];
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
document.body.dataset.sceneReady = "false";
document.body.dataset.socialMaterialsReady = "false";
document.body.dataset.pokeState = "idle";
document.body.dataset.onCommittee = "false";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR_COLOUR);
let canvasRect = canvas.getBoundingClientRect();
let viewportWidth = Math.max(canvas.clientWidth || window.innerWidth, 320);
let viewportHeight = Math.max(canvas.clientHeight || window.innerHeight, 320);

const starGeometry = new THREE.SphereGeometry(STAR_RADIUS, 8, 8);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const starField = new THREE.Group();
scene.add(starField);

function generateStars() {
  const star = new THREE.Mesh(starGeometry, starMaterial);
  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(800));

  star.position.set(x, y, z);
  starField.add(star);
}

Array(STAR_COUNT).fill().forEach(generateStars);

const camera = new THREE.PerspectiveCamera(
  CAM_FOV,
  viewportWidth / viewportHeight,
  CAM_NEAR,
  CAM_FAR,
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
    logCameraPosition("Camera (OrbitControls)"),
  );
}

if (ENABLE_ORBIT_CONTROLS) {
  const grid = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
  scene.add(grid);
}

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x2a2f45, 0.95);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
scene.add(keyLight);
scene.add(keyLight.target);

const fillLight = new THREE.DirectionalLight(0xbfd2ff, 0.62);
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

let lastSceneProgress = 0;

function reportSceneProgress(ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= lastSceneProgress) return;
  lastSceneProgress = clamped;
  window.dispatchEvent(
    new CustomEvent("uqrl:scene-progress", { detail: clamped }),
  );
}

function markSceneReady() {
  document.body.dataset.sceneReady = "true";
  reportSceneProgress(1);
  window.dispatchEvent(new Event("uqrl:scene-ready"));
}

const loadManager = new THREE.LoadingManager();
let pendingAssetLoads = 0;
const assetIdleResolvers = [];

function resolveAssetIdle() {
  while (assetIdleResolvers.length > 0) {
    assetIdleResolvers.shift()?.();
  }
}

function waitForAssets(timeoutMs = 12000) {
  if (pendingAssetLoads <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);

    assetIdleResolvers.push(finish);
  });
}

loadManager.onStart = () => {
  pendingAssetLoads += 1;
};
loadManager.onProgress = (_url, loaded, total) => {
  pendingAssetLoads = Math.max(total - loaded, 0);
  if (!total) return;
  // Asset fetches occupy most of the bar after boot scaffolding.
  reportSceneProgress(0.18 + (loaded / total) * 0.72);
  if (pendingAssetLoads <= 0) resolveAssetIdle();
};
loadManager.onError = () => {
  pendingAssetLoads = Math.max(pendingAssetLoads - 1, 0);
  if (pendingAssetLoads <= 0) resolveAssetIdle();
};

const loader = new GLTFLoader(loadManager);
const textureLoader = new THREE.TextureLoader(loadManager);

const lookTarget = new THREE.Vector3();
const modelCenter = new THREE.Vector3();
let modelGroup = null;
let modelLookHeight = 0;
let modelSizeMax = 1;
let cameraZ = 5;
let camLeftOffset = 0;
let camHeightOffset = 0;
let currentIndex = 0;
let isAnimating = false;
let entranceComplete = false;
let sectionTexts = [];
let sectionDescriptionTexts = [];
let sectionGroups = [];
let socialCubes = [];
let sponsorImage = null;
let aboutJoinImage = null;
let aboutActionIcons = [];
let committeeMembers = [];
let hoveredCommitteeImage = null;
let cachedViewportLayout = null;
// Mobile address bars change innerHeight while scrolling; scroll geometry is
// pinned to this value so progress does not jump mid-gesture.
let stableViewportHeight = viewportHeight;
let clothTexture = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDirty = true;
let rainbowBackdrop = null;
let modelScrollScale = 1;
let rainbowHue = 0;
let roundedAlphaTexture = null;
let baseCameraZ = 5;
let baseCamLeftOffset = 0;
let baseCamHeightOffset = 0;
const pointerTarget = new THREE.Vector2(0, 0);
const pointerCurrent = new THREE.Vector2(0, 0);
const pointerNeutral = new THREE.Vector2(0, 0);
let lastPointerAt = 0;
let lastPointerClientX = Number.NEGATIVE_INFINITY;
let lastPointerClientY = Number.NEGATIVE_INFINITY;
let pointerIsDown = false;
let pointerPressure = 0;
let lastPointerType = "mouse";
let parallaxActive = false;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
let animationFrame = 0;
let resizeObserver = null;
let scrollStops = [];
let activeStop = -1;

function syncReducedMotionState() {
  document.body.dataset.reducedMotion = prefersReducedMotion.matches
    ? "true"
    : "false";
}

syncReducedMotionState();
prefersReducedMotion.addEventListener?.("change", syncReducedMotionState);

function motionDuration(seconds) {
  return prefersReducedMotion.matches ? 0 : seconds;
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function createClothTexture() {
  if (clothTexture) return clothTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#8f93a0";
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.22;
  for (let y = -size; y < size * 2; y += 18) {
    ctx.strokeStyle = y % 36 === 0 ? "#f8efe0" : "#676d7e";
    ctx.lineWidth = y % 36 === 0 ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.moveTo(-size, y);
    ctx.lineTo(size * 2, y + 8);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 280; i += 1) {
    const x = (i * 37) % size;
    const y = (i * 91) % size;
    const radius = i % 2 === 0 ? 0.9 : 1.2;
    ctx.fillStyle = i % 3 === 0 ? "#fff6ea" : "#5f6574";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  clothTexture = new THREE.CanvasTexture(canvas);
  clothTexture.wrapS = THREE.RepeatWrapping;
  clothTexture.wrapT = THREE.RepeatWrapping;
  clothTexture.repeat.set(1.6, 1.6);
  clothTexture.minFilter = THREE.LinearMipmapLinearFilter;
  clothTexture.magFilter = THREE.LinearFilter;
  clothTexture.generateMipmaps = true;
  clothTexture.needsUpdate = true;
  return clothTexture;
}

function isCompactViewport() {
  return viewportWidth <= COMPACT_VIEWPORT_WIDTH || viewportHeight <= 480;
}

function isShortViewport() {
  return viewportHeight <= SHORT_VIEWPORT_HEIGHT;
}

function isMobileUserAgent() {
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function getRenderPixelRatio() {
  const canvasPixels = viewportWidth * viewportHeight;
  const maxRatio =
    canvasPixels <= 480_000 ? 3 : canvasPixels <= 1_100_000 ? 2.5 : 2;

  return Math.min(window.devicePixelRatio || 1, maxRatio);
}

function updateViewportSize() {
  canvasRect = canvas.getBoundingClientRect();
  const rect = canvasRect;

  viewportWidth = Math.max(Math.round(rect.width || window.innerWidth), 320);
  viewportHeight = Math.max(Math.round(rect.height || window.innerHeight), 240);
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

  pointerCurrent.lerp(
    pointerTarget,
    reduced ? REDUCED_POINTER_DAMPING : POINTER_DAMPING,
  );

  if (!modelGroup || isAnimating) return;

  const layout = getViewportLayout();
  const sectionPos = getCameraAnchorPos();
  const parallaxX = reduced
    ? 0
    : pointerCurrent.x * (layout.compact ? 0.14 : 0.26);
  const parallaxY = reduced
    ? 0
    : pointerCurrent.y * (layout.compact ? 0.1 : 0.16);

  camera.position.set(
    sectionPos.x - camLeftOffset + parallaxX,
    sectionPos.y + camHeightOffset - parallaxY,
    cameraZ,
  );
  lookTarget.set(
    sectionPos.x + parallaxX * 0.25,
    sectionPos.y + modelLookHeight - parallaxY * 0.2,
    sectionPos.z,
  );
  camera.lookAt(lookTarget);

  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x) -
    (reduced ? 0 : pointerCurrent.y * 0.075),
    THREE.MathUtils.degToRad(MODEL_ROTATION.y) +
    (reduced ? 0 : pointerCurrent.x * 0.105),
    THREE.MathUtils.degToRad(MODEL_ROTATION.z),
  );

  if (!reduced) {
    modelGroup.position.x +=
      pointerCurrent.x * modelSizeMax * MODEL_PARALLAX_X;
    modelGroup.position.y +=
      pointerCurrent.y * modelSizeMax * MODEL_PARALLAX_Y;
  }
  updateRainbowBackdropPosition();

  const tiltX = reduced ? 0 : -pointerCurrent.y * 0.095;
  const tiltY = reduced ? 0 : pointerCurrent.x * 0.14;

  for (const cube of socialCubes) {
    if (cube.visible) {
      cube.rotation.x = tiltX;
      cube.rotation.y = tiltY;
    }
  }

  for (const member of committeeMembers) {
    if (member.image.visible && !member.image.userData.motionActive) {
      const profile = getCommitteeHoverProfile(member.roleSlug);
      const baseX = member.image.userData.baseX ?? member.image.position.x;
      const baseY = member.image.userData.baseY ?? member.image.position.y;
      const driftX = reduced ? 0 : pointerCurrent.x * profile.driftX * 0.28;
      const driftY = reduced ? 0 : pointerCurrent.y * profile.driftY * 0.18;
      member.image.rotation.set(
        tiltX * (0.65 + profile.driftY),
        tiltY * (0.65 + profile.driftX),
        0,
      );
      member.image.position.x = baseX + driftX;
      member.image.position.y = baseY + driftY;
      member.image.position.z = COMMITTEE_BASE_POSITION.z;
      if (member.caption.visible) {
        member.caption.position.x = member.image.position.x;
      }
    }
  }

  for (const mesh of aboutActionIcons) {
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
  const cameraScale = narrow
    ? 1.18
    : compact
      ? 1.12
      : short
        ? 1.03
        : wide
          ? 0.82
          : 0.94;
  const cameraYOffset = narrow ? 0.7 : compact ? 0.4 : 0;
  const fov = narrow ? 66 : compact ? 64 : CAM_FOV;
  const cameraZ = baseCameraZ * cameraScale;
  const cameraY = baseCamHeightOffset + cameraYOffset;
  const anchorZ = -20;
  const viewDz = cameraZ - anchorZ;
  const viewDy = modelLookHeight - cameraY;

  // Visible world size at a fixed z plane, so text/icons can be laid out in
  // disjoint bands instead of guessing fixed coordinates.
  const planeMetrics = (z) => {
    const t = Math.abs(viewDz) > 1e-4 ? (cameraZ - z) / viewDz : 1;
    const viewDist = Math.hypot(viewDz, viewDy) * Math.max(t, 0.05);
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * viewDist;

    return {
      centerY: cameraY + viewDy * t,
      halfHeight,
      halfWidth: halfHeight * (viewportWidth / viewportHeight),
    };
  };
  const compactTextZ = compact ? -18 : -20;
  const textPlane = planeMetrics(compactTextZ);
  const committeePlane = planeMetrics(-25);
  const socialPlane = planeMetrics(-20);
  const aboutPlane = planeMetrics(ABOUT_IMAGE_POS.z);

  cachedViewportLayout = {
    narrow,
    compact,
    tablet,
    landscape,
    wide,
    cameraScale,
    cameraYOffset,
    titleFontSize: narrow
      ? 1.34
      : compact
        ? 1.46
        : short
          ? 1.55
          : wide
            ? 1.9
            : TEXT_FONT_SIZE,
    descriptionFontSize: narrow
      ? 0.98 * COMPACT_DESCRIPTION_SCALE
      : compact
        ? 1.04 * COMPACT_DESCRIPTION_SCALE
        : short
          ? 1
          : DESCRIPTION_FONT_SIZE,
    textMaxWidth: narrow
      ? Math.max(6, Math.min(14, textPlane.halfWidth * 1.72))
      : compact
        ? Math.max(10, Math.min(18, textPlane.halfWidth * 1.7))
        : tablet
          ? 30
          : wide
            ? 34
            : 36,
    compactTextZ,
    compactTitleY: textPlane.centerY + textPlane.halfHeight * 0.665,
    compactDescriptionY: textPlane.centerY + textPlane.halfHeight * 0.5,
    compactHomeDescriptionY: textPlane.centerY - textPlane.halfHeight * 0.24,
    sponsorImageHeight: compact
      ? 5.25 * COMPACT_ICON_SCALE
      : SPONSOR_IMAGE_HEIGHT,
    sponsorImageY: compact
      ? 1.5
      : SPONSOR_IMAGE_POS.y + SPONSOR_IMAGE_Y_OFFSET,
    aboutImageHeight: narrow ? 2.7 : compact ? 3.2 : ABOUT_IMAGE_HEIGHT,
    aboutRowMaxWidth: aboutPlane.halfWidth * 1.8,
    aboutImageY: narrow
      ? -0.5
      : compact
        ? -3
        : ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    socialCubeSpacing: narrow
      ? 2.7
      : compact
        ? 3.2
        : SOCIAL_CUBES.length > 4
          ? 4.35
          : SOCIAL_CUBE_SPACING,
    socialCubeY: compact ? -4.7 : SOCIAL_CUBE_BASE.y,
    socialDice: compact,
    socialDiceSpacing: narrow
      ? Math.min(3.4, socialPlane.halfWidth * 1.1)
      : 3.8,
    socialDiceRowStep: narrow ? 4 : 4.2,
    socialCardWidth: narrow ? 2.7 : compact ? 3.05 : 3.25,
    socialCardHeight: narrow ? 2.7 : compact ? 3.05 : 3.25,
    committeeImageHeight: narrow
      ? 2.4 * COMPACT_ICON_SCALE
      : compact
        ? 3.35 * COMPACT_ICON_SCALE
        : tablet
          ? 4.8
          : wide
            ? 6.3
            : COMMITTEE_IMAGE_HEIGHT,
    committeeImageSpacing: narrow
      ? 3.8
      : compact
        ? 5.1
        : tablet
          ? 8.1
          : wide
            ? 12.9
            : COMMITTEE_IMAGE_SPACING,
    committeeRowSpacing: narrow
      ? 4.4
      : compact
        ? 5
        : tablet
          ? 6.9
          : wide
            ? 9.8
            : COMMITTEE_ROW_SPACING,
    committeeCaptionFontSize: narrow
      ? 0.62
      : compact
        ? 0.7
        : COMMITTEE_CAPTION_FONT_SIZE,
    committeeBaseY: narrow ? 2.5 : compact ? 3 : COMMITTEE_BASE_POSITION.y,
    committeeMobileRows: narrow ? [3, 4] : compact ? [3, 4] : null,
    committeeSlideSpan: compact
      ? committeePlane.halfWidth * 1.8
      : committeePlane.halfWidth * 1.4,
  };

  if (landscape) {
    cachedViewportLayout.titleFontSize = 1.08;
    cachedViewportLayout.descriptionFontSize = 0.78 * COMPACT_DESCRIPTION_SCALE;
    cachedViewportLayout.textMaxWidth = 16;
    cachedViewportLayout.aboutImageHeight = 3.8;
    cachedViewportLayout.sponsorImageHeight = 4.5 * COMPACT_ICON_SCALE;
    cachedViewportLayout.socialCardWidth = 3;
    cachedViewportLayout.socialCardHeight = 3;
    cachedViewportLayout.committeeImageHeight = 3.7 * COMPACT_ICON_SCALE;
    cachedViewportLayout.committeeImageSpacing = 5.35;
    cachedViewportLayout.committeeRowSpacing = 4.8;
    cachedViewportLayout.committeeCaptionFontSize = 0.62;
    cachedViewportLayout.committeeMobileRows = [3, 4];

  }

  return cachedViewportLayout;
}

function getCommitteeHoverProfile(roleSlug = "") {
  const role = roleSlug.toLowerCase();

  if (role.includes("president")) {
    return {
      scale: 1.08,
      z: 1.45,
      driftX: 0.02,
      driftY: 0.014,
      bob: 0.04,
      rotate: 0.012,
    };
  }

  if (role.includes("secretary")) {
    return {
      scale: 1.05,
      z: 1.26,
      driftX: -0.018,
      driftY: 0.012,
      bob: 0.05,
      rotate: -0.012,
    };
  }

  if (role.includes("treasurer")) {
    return {
      scale: 1.06,
      z: 1.34,
      driftX: 0.016,
      driftY: -0.02,
      bob: 0.055,
      rotate: 0.016,
    };
  }

  if (role.includes("media")) {
    return {
      scale: 1.065,
      z: 1.2,
      driftX: -0.024,
      driftY: 0.01,
      bob: 0.07,
      rotate: -0.018,
    };
  }

  if (role.includes("events")) {
    return {
      scale: 1.06,
      z: 1.28,
      driftX: 0.018,
      driftY: 0.016,
      bob: 0.055,
      rotate: 0.018,
    };
  }

  if (role.includes("workshop")) {
    return {
      scale: 1.045,
      z: 1.2,
      driftX: -0.016,
      driftY: -0.012,
      bob: 0.04,
      rotate: -0.012,
    };
  }

  if (role.includes("industry")) {
    return {
      scale: 1.05,
      z: 1.22,
      driftX: 0.02,
      driftY: 0.01,
      bob: 0.035,
      rotate: 0.014,
    };
  }

  return {
    scale: 1.045,
    z: 1.18,
    driftX: 0.014,
    driftY: 0.012,
    bob: 0.045,
    rotate: 0.012,
  };
}

function getSocialHoverProfile(label = "") {
  const name = label.toLowerCase();

  if (name.includes("discord")) {
    return {
      scaleX: 1.08,
      scaleY: 1.03,
      scaleZ: 1.04,
      z: 1.2,
      rotate: 0.02,
      lift: 0.13,
    };
  }

  if (name.includes("email")) {
    return {
      scaleX: 1.03,
      scaleY: 1.08,
      scaleZ: 1.03,
      z: 1.05,
      rotate: -0.015,
      lift: 0.1,
    };
  }

  if (name.includes("instagram")) {
    return {
      scaleX: 1.05,
      scaleY: 1.05,
      scaleZ: 1.05,
      z: 1.15,
      rotate: -0.022,
      lift: 0.12,
    };
  }

  if (name.includes("linkedin")) {
    return {
      scaleX: 1.06,
      scaleY: 1.04,
      scaleZ: 1.03,
      z: 1.1,
      rotate: 0.016,
      lift: 0.09,
    };
  }

  return {
    scaleX: 1.05,
    scaleY: 1.05,
    scaleZ: 1.04,
    z: 1.1,
    rotate: 0.02,
    lift: 0.11,
  };
}

function getResponsiveSection(section, index, isDescription = false) {
  if (!isCompactViewport()) return section;

  const layout = getViewportLayout();
  const y = isDescription
    ? index === 0
      ? layout.compactHomeDescriptionY
      : layout.compactDescriptionY
    : layout.compactTitleY;

  return {
    ...section,
    x: 0,
    y,
    z: layout.compactTextZ,
    textAlign: "center",
    anchorX: "center",
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

  lastPointerClientX = event.clientX;
  lastPointerClientY = event.clientY;
  if ("pointerType" in event && event.pointerType) {
    lastPointerType = event.pointerType;
  }
  if ("pressure" in event && Number.isFinite(event.pressure)) {
    pointerPressure = event.pressure;
  }

  mouse.x = THREE.MathUtils.clamp(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -1,
    1,
  );
  mouse.y = THREE.MathUtils.clamp(
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
    -1,
    1,
  );
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

function applyModelRotation() {
  if (!modelGroup) return;

  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x),
    THREE.MathUtils.degToRad(MODEL_ROTATION.y),
    THREE.MathUtils.degToRad(MODEL_ROTATION.z),
  );
}

function aimLightsAtModel() {
  const pos = modelGroup ? modelGroup.position : getCurrentSectionPos();
  lightTarget.set(pos.x, pos.y + modelLookHeight, pos.z);

  hemiLight.position.set(lightTarget.x, lightTarget.y + 30, lightTarget.z);

  keyLight.position.set(
    lightTarget.x + KEY_LIGHT_OFFSET.x,
    lightTarget.y + KEY_LIGHT_OFFSET.y,
    lightTarget.z + KEY_LIGHT_OFFSET.z,
  );
  keyLight.target.position.copy(lightTarget);

  fillLight.position.set(
    lightTarget.x + FILL_LIGHT_OFFSET.x,
    lightTarget.y + FILL_LIGHT_OFFSET.y,
    lightTarget.z + FILL_LIGHT_OFFSET.z,
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
    center,
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
  texture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function parseTextureFocus(focus = "50% 50%") {
  const [rawX = "50%", rawY = "50%"] = String(focus).split(/\s+/);
  const read = (value) =>
    THREE.MathUtils.clamp(Number.parseFloat(value) / 100, 0, 1);

  return { x: read(rawX), y: read(rawY) };
}

function coverSquareTexture(texture, aspect, focus) {
  const { x, y } = parseTextureFocus(focus);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  if (aspect > 1) {
    texture.repeat.set(1 / aspect, 1);
    texture.offset.set(
      clamp(x - texture.repeat.x / 2, 0, 1 - texture.repeat.x),
      0,
    );
  } else {
    texture.repeat.set(1, aspect);
    texture.offset.set(
      0,
      clamp(1 - y - texture.repeat.y / 2, 0, 1 - texture.repeat.y),
    );
  }

  texture.needsUpdate = true;
}

function createSocialTexture({ texture }) {
  const loaded = textureLoader.load(texture, (decoded) => {
    renderer.initTexture?.(decoded);
  });

  return polishTexture(loaded);
}

function createRoundedIconMaterial(texture) {
  polishTexture(texture);

  return new THREE.MeshPhysicalMaterial({
    map: texture,
    alphaMap: getRoundedAlphaTexture(),
    alphaTest: 0.02,
    transparent: true,
    roughness: 0.58,
    metalness: 0.02,
    clearcoat: 0.26,
    clearcoatRoughness: 0.3,
    sheen: 0.34,
    sheenColor: new THREE.Color(0xf5e6d2),
    sheenRoughness: 0.78,
    roughnessMap: createClothTexture(),
    emissive: 0x0f1420,
    emissiveIntensity: 0.05,
    side: THREE.DoubleSide,
  });
}

function getSocialMaterialProfile(label = "") {
  const kind = getSocialMaterialKind(label);

  if (kind === "rubber") {
    return {
      base: 0x1a1f29,
      top: 0x222838,
      bottom: 0x131824,
      back: 0x171c25,
      roughness: 0.98,
      metalness: 0.01,
      clearcoat: 0.04,
      clearcoatRoughness: 0.92,
      sheen: 0.02,
      sheenColor: new THREE.Color(0xd4d9e8),
      sheenRoughness: 0.98,
      roughnessMap: null,
    };
  }

  if (kind === "mail") {
    return {
      base: 0xd89a28,
      top: 0xf7c948,
      bottom: 0x8f5f16,
      back: 0xb7791f,
      roughness: 0.88,
      metalness: 0.01,
      clearcoat: 0.08,
      clearcoatRoughness: 0.82,
      sheen: 0.34,
      sheenColor: new THREE.Color(0xfff1b8),
      sheenRoughness: 0.9,
      roughnessMap: createClothTexture(),
    };
  }

  if (kind === "cloth") {
    return {
      base: 0x1d2230,
      top: 0x273248,
      bottom: 0x101521,
      back: 0x181d2a,
      roughness: 0.78,
      metalness: 0.02,
      clearcoat: 0.12,
      clearcoatRoughness: 0.56,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xf5e6d2),
      sheenRoughness: 0.88,
      roughnessMap: createClothTexture(),
    };
  }

  if (kind === "glass") {
    return {
      base: 0x647381,
      top: 0x7a8796,
      bottom: 0x44515d,
      back: 0x56616d,
      roughness: 0.16,
      metalness: 0.42,
      clearcoat: 0.94,
      clearcoatRoughness: 0.06,
      sheen: 0.03,
      sheenColor: new THREE.Color(0xd8dde4),
      sheenRoughness: 0.66,
      roughnessMap: null,
    };
  }

  return {
    base: 0x191f2d,
    top: 0x202638,
    bottom: 0x0f141e,
    back: 0x171d2a,
    roughness: 0.7,
    metalness: 0.01,
    clearcoat: 0.14,
    clearcoatRoughness: 0.46,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xfff4df),
    sheenRoughness: 0.92,
    roughnessMap: createClothTexture(),
  };
}

function createMaterialTouchField(label = "") {
  const config = getSocialMaterialConfig(label);
  const size =
    config.kind === "mail"
      ? SOCIAL_TOUCH_TEXTURE_SIZE / 2
      : SOCIAL_TOUCH_TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return {
    config,
    canvas,
    ctx,
    texture,
    poke: createPokeState(),
    world: new THREE.Vector3(),
    touched: false,
  };
}

function stampMaterialTouch(field, uv, worldPoint, pressure = 0.25) {
  if (!field || !uv) return;
  const boosted = pressure * field.config.pressBoost;
  applyPoke(field.poke, uv.x, uv.y, Math.min(1, boosted));
  if (worldPoint) field.world.copy(worldPoint);
  field.touched = true;
}

function fadeMaterialTouchField(field) {
  const fade =
    field.config.kind === "glass"
      ? 0.035
      : field.config.kind === "rubber"
        ? 0.11
        : 0.065;
  field.ctx.globalCompositeOperation = "source-over";
  field.ctx.fillStyle = `rgba(0,0,0,${fade})`;
  field.ctx.fillRect(0, 0, field.canvas.width, field.canvas.height);
}

function drawMaterialTouchField(field) {
  const { ctx, canvas, poke, config } = field;
  const velocity = getPokeVelocity(poke);
  const size = canvas.width;
  const x = poke.x * size;
  const y = (1 - poke.y) * size;
  const force = poke.pressure * (prefersReducedMotion.matches ? 0.45 : 1);
  const radius =
    (config.kind === "glass" ? 22 : config.kind === "rubber" ? 28 : 20) +
    force * 18;

  ctx.globalCompositeOperation = "lighter";

  if (config.kind === "glass") {
    const smear = ctx.createLinearGradient(
      x - velocity.x * size * 1.8,
      y + velocity.y * size * 1.8,
      x + velocity.x * size * 2.4,
      y - velocity.y * size * 2.4,
    );
    smear.addColorStop(0, `rgba(255,255,255,${0.04 + force * 0.08})`);
    smear.addColorStop(0.5, `rgba(255,255,255,${0.18 + force * 0.32})`);
    smear.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = smear;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      radius * (1.2 + velocity.length),
      radius * 0.45,
      Math.atan2(-velocity.y, velocity.x),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }

  const dent = ctx.createRadialGradient(x, y, 1, x, y, radius);
  dent.addColorStop(0, `rgba(255,255,255,${0.5 + force * 0.45})`);
  dent.addColorStop(0.45, `rgba(255,255,255,${0.2 + force * 0.22})`);
  dent.addColorStop(
    0.72,
    config.kind === "rubber"
      ? `rgba(255,255,255,${0.28 * force})`
      : "rgba(255,255,255,0.04)",
  );
  dent.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = dent;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (config.kind === "cloth") {
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + force * 0.26})`;
    ctx.lineWidth = 1.2 + force * 1.5;
    const angle = Math.atan2(-velocity.y || 0.15, velocity.x || 0.2) + Math.PI / 2;
    for (let i = -2; i <= 2; i += 1) {
      const offset = i * (6 + velocity.length * 108);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * offset - 26, y + Math.sin(angle) * offset);
      ctx.quadraticCurveTo(
        x,
        y + offset * 0.25,
        x + Math.cos(angle) * offset + 26,
        y + Math.sin(angle) * offset,
      );
      ctx.stroke();
    }
  }
}

function updateMaterialTouchField(field) {
  if (!field) return;
  if (
    !field.poke.active &&
    field.poke.pressure <= 0.015 &&
    field.poke.targetPressure === 0
  ) {
    return;
  }

  stepPoke(field.poke, field.config);
  fadeMaterialTouchField(field);
  if (field.poke.active || field.poke.pressure > 0.015) {
    drawMaterialTouchField(field);
  }
  field.texture.needsUpdate = true;
}

function tuneLogoMaterial(material, label, touchField) {
  const profile = getSocialMaterialProfile(label);
  const kind = touchField.config.kind;

  material.roughness = profile.roughness;
  material.metalness = profile.metalness;
  material.clearcoat = profile.clearcoat;
  material.clearcoatRoughness = profile.clearcoatRoughness;
  material.sheen = profile.sheen;
  material.sheenColor = profile.sheenColor;
  material.sheenRoughness = profile.sheenRoughness;
  material.roughnessMap = kind === "glass" ? touchField.texture : profile.roughnessMap;
  material.bumpMap = touchField.texture;
  material.bumpScale = kind === "glass" ? 0.018 : kind === "rubber" ? 0.05 : 0.032;
  material.displacementMap = kind === "glass" ? null : touchField.texture;
  material.displacementScale =
    kind === "rubber" ? -0.1 : kind === "mail" ? -0.045 : -0.07;
  material.envMapIntensity = kind === "glass" ? 1.4 : 0.9;
  material.needsUpdate = true;

  if (kind === "glass") {
    material.transparent = true;
    material.opacity = 0.86;
  }
}

function createSocialLogoMaterial(texture, label, touchField) {
  const material = createRoundedIconMaterial(texture);
  tuneLogoMaterial(material, label, touchField);
  return material;
}

function createSocialLogoMesh(texture, label, touchField, layout) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(layout.socialCardWidth, layout.socialCardHeight, 48, 48),
    createSocialLogoMaterial(texture, label, touchField),
  );

  mesh.position.set(0, 0, SOCIAL_CARD_DEPTH / 2 + 0.035);
  mesh.userData.isSocialLogo = true;
  mesh.userData.touchField = touchField;
  mesh.renderOrder = 35;
  return mesh;
}

function createSocialCardMaterials(texture, label = "", touchField = null) {
  const profile = getSocialMaterialProfile(label);
  const faceMaterial = createRoundedIconMaterial(texture);
  if (touchField) {
    tuneLogoMaterial(faceMaterial, label, touchField);
  } else {
    faceMaterial.roughness = profile.roughness;
    faceMaterial.metalness = profile.metalness;
    faceMaterial.clearcoat = profile.clearcoat;
    faceMaterial.clearcoatRoughness = profile.clearcoatRoughness;
    faceMaterial.sheen = profile.sheen;
    faceMaterial.sheenColor = profile.sheenColor;
    faceMaterial.sheenRoughness = profile.sheenRoughness;
    faceMaterial.roughnessMap = profile.roughnessMap;
  }

  const sheetMaterial = new THREE.MeshPhysicalMaterial({
    color: profile.base,
    roughness: profile.roughness,
    metalness: profile.metalness,
    clearcoat: profile.clearcoat,
    clearcoatRoughness: profile.clearcoatRoughness,
    sheen: profile.sheen,
    sheenColor: profile.sheenColor,
    sheenRoughness: profile.sheenRoughness,
    roughnessMap: profile.roughnessMap,
    bumpMap: touchField?.texture || null,
    bumpScale: touchField ? 0.018 : 0,
    emissive: 0x05070d,
    emissiveIntensity: 0.04,
    side: THREE.DoubleSide,
  });
  const topMaterial = sheetMaterial.clone();
  topMaterial.color.set(profile.top);
  const bottomMaterial = sheetMaterial.clone();
  bottomMaterial.color.set(profile.bottom);
  const backMaterial = sheetMaterial.clone();
  backMaterial.color.set(profile.back);

  return [
    sheetMaterial,
    sheetMaterial,
    topMaterial,
    bottomMaterial,
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
    new THREE.PlaneGeometry(
      maxSize * RAINBOW_GLOW_SCALE,
      maxSize * RAINBOW_GLOW_SCALE,
    ),
    createRainbowGlowMaterial(texture, 0.7),
  );
  group.add(innerGlow);

  const outerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      maxSize * RAINBOW_OUTER_GLOW_SCALE,
      maxSize * RAINBOW_OUTER_GLOW_SCALE,
    ),
    createRainbowGlowMaterial(texture, 0.35),
  );
  group.add(outerGlow);

  const pointLight = new THREE.PointLight(
    0xffffff,
    RAINBOW_LIGHT_INTENSITY,
    maxSize * RAINBOW_LIGHT_DISTANCE,
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
  const innerScale = layout.narrow
    ? 4.8
    : layout.compact
      ? 5.2
      : layout.wide
        ? 6.4
        : RAINBOW_GLOW_SCALE;
  const outerScale = layout.narrow
    ? 6.6
    : layout.compact
      ? 7.2
      : layout.wide
        ? 9.2
        : RAINBOW_OUTER_GLOW_SCALE;

  resizeSquarePlane(target.userData.glowMeshes[0], baseSize * innerScale);
  resizeSquarePlane(target.userData.glowMeshes[1], baseSize * outerScale);
}

function updateRainbowBackdropPosition() {
  if (!rainbowBackdrop || !modelGroup) return;

  const center = modelCenter
    .clone()
    .multiplyScalar(modelScrollScale)
    .add(modelGroup.position);

  const zPlane = center.z + RAINBOW_Z_OFFSET;
  const cam = camera.position;
  const denom = center.z - cam.z;
  const t = Math.abs(denom) > 0.001 ? (zPlane - cam.z) / denom : 1;

  rainbowBackdrop.position.set(
    cam.x + (center.x - cam.x) * t,
    cam.y + (center.y - cam.y) * t,
    zPlane,
  );
  rainbowBackdrop.scale.setScalar(modelScrollScale);
}

function updateRainbowBackdropRotation() {
  if (!rainbowBackdrop?.visible) return;

  rainbowBackdrop.lookAt(camera.position);
}

function setRainbowVisible(visible) {
  if (!rainbowBackdrop) return;

  const { glowMeshes, glowOpacities, pointLight } = rainbowBackdrop.userData;
  rainbowBackdrop.visible = visible;
  pointLight.intensity = visible ? RAINBOW_LIGHT_INTENSITY : 0;
  glowMeshes.forEach((mesh, index) => {
    mesh.material.opacity = visible ? glowOpacities[index] : 0;
  });
}

function animateRainbowBackdrop() {
  if (!rainbowBackdrop?.visible) return;
  if (prefersReducedMotion.matches) {
    updateRainbowBackdropRotation();
    return;
  }

  rainbowHue = (rainbowHue + 0.003) % 1;
  const pulse = 1 + Math.sin(rainbowHue * Math.PI * 2) * 0.14;
  rainbowBackdrop.userData.pointLight.color.setHSL(rainbowHue, 1, 0.62);
  rainbowBackdrop.userData.pointLight.intensity =
    RAINBOW_LIGHT_INTENSITY * pulse;
  rainbowBackdrop.userData.glowMeshes.forEach((mesh, index) => {
    mesh.material.opacity =
      rainbowBackdrop.userData.glowOpacities[index] * pulse;
  });
  updateRainbowBackdropRotation();
}

function setCameraOnModel(sectionPos = getCameraAnchorPos()) {
  if (!modelGroup) return;

  camera.position.set(
    sectionPos.x - camLeftOffset,
    sectionPos.y + camHeightOffset,
    cameraZ,
  );

  lookTarget.set(sectionPos.x, sectionPos.y + modelLookHeight, sectionPos.z);
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
  const tab = TABS[currentIndex];

  document.body.dataset.section = String(currentIndex);
  document.body.dataset.sectionSlug = tab?.slug || String(currentIndex);
  document.body.dataset.contentVariant = tab?.pathVariant || "underline-swoop";
  document.body.style.setProperty(
    "--content-accent",
    tab?.accentColor || "#FF5757",
  );
  document.body.style.setProperty(
    "--content-trail",
    tab?.trailColor || tab?.accentColor || "#FF5757",
  );
  if (currentIndex !== COMMITTEE_SECTION_INDEX) {
    closeMemberPopup();
  }
}

function getCommitteeCards() {
  return committeeMembers;
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
    return {
      center,
      left: center.x,
      right: center.x,
      top: center.y,
      bottom: center.y,
    };
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
  const maxLeft =
    viewport.left + viewport.width - safe.right - rect.width - pad;
  const maxTop =
    viewport.top + viewport.height - safe.bottom - rect.height - pad;
  let left = anchor.x - rect.width / 2;
  let top = anchor.y - rect.height / 2;

  if (top < minTop || top > maxTop) {
    const above = anchor.y - rect.height - gap;
    const below = anchor.y + gap;
    top =
      anchor.y > viewport.top + viewport.height / 2 && above >= minTop
        ? above
        : below;
  }

  left = clamp(left, minLeft, maxLeft);
  top = clamp(top, minTop, maxTop);

  const originX = clamp(anchor.x - left, 0, rect.width);
  const originY = clamp(anchor.y - top, 0, rect.height);

  memberPopupCard.style.setProperty("--popup-left", `${left}px`);
  memberPopupCard.style.setProperty("--popup-top", `${top}px`);
  memberPopupCard.style.setProperty(
    "--popup-dx",
    `${anchor.x - left - originX}px`,
  );
  memberPopupCard.style.setProperty(
    "--popup-dy",
    `${anchor.y - top - originY}px`,
  );
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

  const imagePath = member.sourceImage;
  memberPopupImage.src = imagePath;
  memberPopupImage.srcset = member.photoWidth
    ? `${imagePath} ${member.photoWidth}w`
    : "";
  memberPopupImage.sizes = "(max-width: 860px) min(38vw, 7.2rem), 7.2rem";
  memberPopupImage.width = member.photoWidth || 900;
  memberPopupImage.height = member.photoHeight || member.photoWidth || 900;
  memberPopupImage.style.objectPosition = member.photoFocus || "50% 50%";
  memberPopupImage.alt = member.name;
  memberPopupTitle.textContent = member.name;
  memberPopupRole.textContent = member.title;
  memberPopupCopy.textContent = member.shortBio || member.body || "";
  memberPopupLink.href = member.url;
  memberPopupCard?.style.setProperty("--member-accent", member.accentColor);
  document.body.dataset.popupOpen = "true";
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
  document.body.removeAttribute("data-popup-open");
  currentPopupAnchorObject = null;
  window.setTimeout(
    () => {
      if (!memberPopup.classList.contains("is-open")) {
        memberPopup.hidden = true;

        if (currentIndex === COMMITTEE_SECTION_INDEX) {
          lastMemberTrigger?.focus?.();
        }
      }
    },
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
  );
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

function firstStopForSection(sectionIndex) {
  const index = scrollStops.findIndex(
    (stop) => stop.sectionIndex === sectionIndex,
  );
  return index === -1 ? 0 : index;
}

function scrollToStop(index, smooth = true) {
  if (!scrollStops.length) return;

  const requestedTop =
    Math.max(0, Math.min(index, scrollStops.length - 1)) *
    stableViewportHeight;
  const maxTop = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0,
  );
  const top = Math.min(requestedTop, maxTop);

  window.scrollTo({
    top,
    behavior: smooth && !prefersReducedMotion.matches ? "smooth" : "auto",
  });
}

function goToSection(sectionIndex) {
  scrollToStop(firstStopForSection(sectionIndex));
}

function buildScrollStops() {
  scrollStops = [];
  TABS.forEach((tab, sectionIndex) => {
    if (sectionIndex === COMMITTEE_SECTION_INDEX) {
      COMMITTEE_GROUPS.forEach((group, groupIndex) => {
        scrollStops.push({ sectionIndex, groupIndex });
      });
      return;
    }
    scrollStops.push({ sectionIndex, groupIndex: null });
  });
}

function resizeScrollTrack() {
  if (!scrollTrack) return;
  scrollTrack.style.height = `${Math.max(scrollStops.length, 1) * stableViewportHeight}px`;
}

function buildYearRail() {
  if (!yearRail) return;

  const years = [...new Set(COMMITTEE_GROUPS.map((group) => group.year))];
  yearRail.replaceChildren(
    ...years.map((year) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.year = String(year);
      button.textContent = String(year);
      button.addEventListener("click", () => {
        const index = scrollStops.findIndex(
          (stop) => COMMITTEE_GROUPS[stop.groupIndex]?.year === year,
        );
        if (index !== -1) scrollToStop(index);
      });
      return button;
    }),
  );
  yearRailButtons = [...yearRail.querySelectorAll("button")];
}

function updateYearRail() {
  const stop = scrollStops[activeStop];
  const group =
    stop?.groupIndex !== null && stop?.groupIndex !== undefined
      ? COMMITTEE_GROUPS[stop.groupIndex]
      : null;
  const year = group?.year ?? null;

  document.body.dataset.committeeYear = year ? String(year) : "";
  yearRailButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.year) === year);
  });
}

function applyStopVisibility(stop) {
  const sectionIndex = stop.sectionIndex;

  setRainbowVisible(sectionIndex === 0);

  if (sectionIndex !== COMMITTEE_SECTION_INDEX) {
    setCommitteeImageHovered(null);
  }

  document.body.dataset.onCommittee =
    sectionIndex === COMMITTEE_SECTION_INDEX ? "true" : "false";
}

function getSectionDelta(stopFloat, sectionIndex) {
  let settledStart = sectionIndex;
  let settledEnd = sectionIndex;

  if (sectionIndex === COMMITTEE_SECTION_INDEX) {
    const committeeStops = scrollStops
      .map((stop, index) => (stop.sectionIndex === sectionIndex ? index : -1))
      .filter((index) => index >= 0);

    if (committeeStops.length > 0) {
      settledStart = committeeStops[0];
      settledEnd = committeeStops[committeeStops.length - 1];
    }
  }

  if (stopFloat < settledStart) return stopFloat - settledStart;
  if (stopFloat > settledEnd) return stopFloat - settledEnd;
  return 0;
}

function applyContentMotion(group, delta) {
  if (!group) return;

  const distance = Math.abs(delta);
  group.position.set(
    0,
    delta * SECTION_Y_SPAN,
    -distance * SECTION_Z_SPAN,
  );
  group.scale.setScalar(Math.max(0.2, 1 - distance * SECTION_SHRINK));
}

function applyTextMotion(textMesh, delta) {
  if (!textMesh) return;

  const base = textMesh.userData.basePosition;
  if (!base) return;

  const distance = Math.abs(delta);
  const visible = distance < 1;

  textMesh.visible = visible;
  if (!visible) return;

  textMesh.position.set(
    base.x,
    base.y + delta * SECTION_Y_SPAN,
    base.z - distance * SECTION_Z_SPAN,
  );
  textMesh.scale.setScalar(Math.max(0.2, 1 - distance * SECTION_SHRINK));
  textMesh.fillOpacity = Math.max(0, 1 - distance);
}

function getCommitteeGroupStop(groupIndex) {
  return scrollStops.findIndex(
    (stop) =>
      stop.sectionIndex === COMMITTEE_SECTION_INDEX &&
      stop.groupIndex === groupIndex,
  );
}

function applyCommitteeMemberMotion(member, delta, vertical = false) {
  const image = member.image;
  const caption = member.caption;
  const distance = Math.abs(delta);
  const visible = distance < 1;

  image.visible = visible;
  caption.visible = visible;

  if (!visible) return;

  const baseX = image.userData.baseX ?? 0;
  const baseY = image.userData.baseY ?? 0;
  const baseZ = COMMITTEE_BASE_POSITION.z;

  // Settled: let hover tweens own the transform again.
  if (distance < 0.001) {
    if (!image.userData.settledApplied) {
      const settledScale =
        image === hoveredCommitteeImage
          ? getCommitteeHoverProfile(member.roleSlug).scale
          : 1;
      image.position.set(baseX, baseY, baseZ);
      image.scale.setScalar(settledScale);
      image.material.opacity = 1;
      caption.position.set(baseX, caption.userData.baseY ?? baseY, baseZ);
      caption.scale.setScalar(1);
      caption.fillOpacity = 1;
      image.userData.settledApplied = true;
      image.userData.motionActive = false;
    }
    return;
  }

  image.userData.settledApplied = false;
  const slide = getViewportLayout().committeeSlideSpan;
  const z = baseZ - distance * SECTION_Z_SPAN;
  const scale = Math.max(0.2, 1 - distance * SECTION_SHRINK);
  const opacity = Math.max(0, 1 - distance * 1.35);
  const x = vertical ? baseX : baseX - delta * slide;
  const y = vertical ? baseY + delta * SECTION_Y_SPAN : baseY;
  const captionY = vertical
    ? (caption.userData.baseY ?? baseY) + delta * SECTION_Y_SPAN
    : (caption.userData.baseY ?? baseY);

  image.userData.motionActive = true;
  image.position.set(x, y, z);
  image.scale.setScalar(scale);
  image.material.opacity = opacity;

  caption.position.set(x, captionY, z);
  caption.scale.setScalar(scale);
  caption.fillOpacity = opacity;
}

const sectionContentVisible = new Map();

function setSectionContentVisible(key, visible, apply) {
  if (sectionContentVisible.get(key) === visible) return;

  sectionContentVisible.set(key, visible);
  apply(visible);
}

function updateSectionMotion(stopFloat) {
  TABS.forEach((_tab, sectionIndex) => {
    const delta = getSectionDelta(stopFloat, sectionIndex);

    if (sectionIndex !== COMMITTEE_SECTION_INDEX) {
      applyContentMotion(sectionGroups[sectionIndex], delta);
    }

    applyTextMotion(sectionTexts[sectionIndex], delta);
    applyTextMotion(sectionDescriptionTexts[sectionIndex], delta);
  });

  setSectionContentVisible(
    "sponsor",
    Math.abs(getSectionDelta(stopFloat, SPONSOR_SECTION_INDEX)) < 1,
    setSponsorVisible,
  );
  setSectionContentVisible(
    "about",
    Math.abs(getSectionDelta(stopFloat, ABOUT_SECTION_INDEX)) < 1,
    setAboutJoinVisible,
  );
  setSectionContentVisible(
    "social",
    Math.abs(getSectionDelta(stopFloat, CONTACT_SECTION_INDEX)) < 1,
    setSocialCubesVisible,
  );

  const firstCommitteeStop = getCommitteeGroupStop(0);

  committeeMembers.forEach((member) => {
    const page = getCommitteeGroupStop(member.groupIndex);

    if (page < 0) return;

    // Entering/leaving the committee section moves with the text; moving
    // between committee groups slides sideways so the text stays put.
    const vertical = page === firstCommitteeStop && stopFloat < page;

    applyCommitteeMemberMotion(member, stopFloat - page, vertical);
  });
}

function setActiveStop(index, force = false) {
  if (!scrollStops.length) return;

  const clamped = Math.max(0, Math.min(index, scrollStops.length - 1));
  if (!force && clamped === activeStop) return;

  activeStop = clamped;
  const stop = scrollStops[clamped];

  currentIndex = stop.sectionIndex;
  updateStatus();
  applyStopVisibility(stop);
  updateYearRail();
}

function updateModelScroll(stopFloat) {
  const active = Math.round(stopFloat) === 0;
  const delta = active ? stopFloat : 0;
  const distance = Math.abs(delta);

  modelScrollScale = Math.max(0.2, 1 - distance * SECTION_SHRINK);
  modelGroup.visible = active;
  modelGroup.position.set(
    0,
    delta * SECTION_Y_SPAN,
    -20 - distance * SECTION_Z_SPAN,
  );
  modelGroup.scale.setScalar(MODEL_SCALE * modelScrollScale);
  aimLightsAtModel();
}

function updateScrollPosition() {
  if (!modelGroup || !entranceComplete) return;

  // A hidden mobile address bar grows innerHeight past the pinned height. Use
  // the larger value so the last stop is still reachable at the page bottom.
  const scrollViewportHeight = Math.max(
    stableViewportHeight,
    window.innerHeight,
  );
  const maxScroll = scrollTrack
    ? Math.max(scrollTrack.offsetHeight - scrollViewportHeight, 0)
    : 0;
  const progress = maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
  const stopFloat = progress * (scrollStops.length - 1);

  updateModelScroll(stopFloat);
  starField.position.y = stopFloat * STAR_SCROLL_STEP;

  const stopIndex = Math.round(stopFloat);
  if (stopIndex !== activeStop) {
    setActiveStop(stopIndex);
  }

  updateSectionMotion(stopFloat);
}

function setupNavbar() {
  if (navLinks) {
    navLinks.replaceChildren();
    TABS.forEach((tab, index) => {
      const button = document.createElement("button");
      const label = document.createElement("span");
      button.type = "button";
      button.dataset.section = String(index);
      button.dataset.short = tab.shortLabel;
      label.textContent = tab.label;
      button.append(label);
      navLinks.append(button);
    });
  }

  navSectionButtons = document.querySelectorAll("#navbar [data-section]");

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

function createSectionGroups() {
  sectionGroups = TABS.map(() => {
    const group = new THREE.Group();
    scene.add(group);
    return group;
  });
}

function addToSection(sectionIndex, object) {
  const group = sectionGroups[sectionIndex];

  if (group) group.add(object);
  else scene.add(object);
}

function createSectionText(section, options = {}, sectionIndex = 0) {
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
  outText.userData.basePosition = {
    x: section.x,
    y: section.y,
    z: section.z,
  };
  outText.text = section.text;
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
  sectionTexts = TEXT_SECTIONS.map((section, index) =>
    createSectionText(section, {}, index),
  );
  sectionDescriptionTexts = DESCRIPTION_SECTIONS.map((section, index) =>
    createSectionText(
      section,
      {
        font: DESCRIPTION_FONT,
        fontSize: DESCRIPTION_FONT_SIZE,
        anchorY: "top",
      },
      index,
    ),
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

  textMesh.userData.basePosition = {
    x: section.x,
    y: section.y,
    z: section.z,
  };
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
      getResponsiveSection(TEXT_SECTIONS[index], index, false),
    );
  });

  sectionDescriptionTexts.forEach((textMesh, index) => {
    textMesh.fontSize = layout.descriptionFontSize;
    applyTextMeshLayout(
      textMesh,
      getResponsiveSection(DESCRIPTION_SECTIONS[index], index, true),
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
  sponsorImage.position.set(
    SPONSOR_IMAGE_POS.x,
    layout.sponsorImageY,
    SPONSOR_IMAGE_POS.z,
  );
  resizePlane(sponsorImage, layout.sponsorImageHeight);
}

function applyAboutJoinImageLayout() {
  if (aboutActionIcons.length === 0) return;

  const layout = getViewportLayout();
  const aspects = aboutActionIcons.map((icon) => icon.userData.aspect ?? 1);
  const gap = ABOUT_ICON_GAP;
  const unitWidth = aspects.reduce((total, aspect) => total + aspect, 0);
  const maxHeight =
    (layout.aboutRowMaxWidth - gap * (aspects.length - 1)) / unitWidth;
  const height = Math.max(1.2, Math.min(layout.aboutImageHeight, maxHeight));
  const totalWidth = unitWidth * height + gap * (aspects.length - 1);
  let cursor = -totalWidth / 2;

  aboutActionIcons.forEach((icon, index) => {
    const width = aspects[index] * height;
    const x = cursor + width / 2;
    cursor += width + gap;

    icon.position.set(x, layout.aboutImageY, ABOUT_IMAGE_POS.z);
    icon.userData.baseX = x;
    icon.userData.baseY = layout.aboutImageY;
    resizePlane(icon, height);

    const underline = icon.userData.underline;
    const caption = icon.userData.caption;

    if (underline) {
      underline.geometry.dispose();
      underline.geometry = new THREE.PlaneGeometry(width * 0.56, 0.055);
      underline.position.set(0, -height / 2 - 0.28, 0.02);
    }

    if (caption) {
      caption.fontSize = layout.narrow ? 0.5 : layout.compact ? 0.56 : 0.64;
      caption.position.set(0, -height / 2 - 0.42, 0.03);
      caption.sync();
    }
  });
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
    sponsorDescription.z,
  );
  mesh.visible = false;
  addToSection(SPONSOR_SECTION_INDEX, mesh);

  textureLoader.load(NUAXION_LOGO_PATH, (texture) => {
    material.map = polishTexture(texture);
    material.needsUpdate = true;

    mesh.userData.aspect = texture.image.width / texture.image.height;
    applySponsorImageLayout();
  });

  return mesh;
}

function setSponsorVisible(visible) {
  if (!sponsorImage) return;

  sponsorImage.visible = visible;
  sponsorImage.material.opacity = visible ? 1 : 0;
}

function createAboutCaption(label) {
  const caption = new Text();

  caption.text = label;
  caption.font = DESCRIPTION_FONT;
  caption.fontSize = 0.56;
  caption.color = 0xffffff;
  caption.anchorX = "center";
  caption.anchorY = "top";
  caption.textAlign = "center";
  caption.renderOrder = 102;
  caption.raycast = () => { };
  caption.sync();
  caption.material.depthTest = false;
  caption.material.depthWrite = false;

  return caption;
}

function createAboutActionIcon(path, url, label, accent) {
  const material = createRoundedImageMaterial();
  material.depthTest = false;
  material.depthWrite = false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  const caption = createAboutCaption(label);
  const underline = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.055),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
    }),
  );

  mesh.position.set(
    ABOUT_IMAGE_POS.x,
    ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    ABOUT_IMAGE_POS.z,
  );
  mesh.renderOrder = 100;
  mesh.userData.url = url;
  mesh.userData.aspect = 1;
  mesh.userData.caption = caption;
  mesh.userData.underline = underline;
  mesh.visible = false;
  underline.renderOrder = 101;
  mesh.add(underline);
  mesh.add(caption);
  addToSection(ABOUT_SECTION_INDEX, mesh);

  textureLoader.load(path, (texture) => {
    material.map = polishTexture(texture);
    material.needsUpdate = true;

    mesh.userData.aspect = texture.image.width / texture.image.height;
    applyAboutJoinImageLayout();
  });

  return mesh;
}

function createAboutActionIcons() {
  aboutJoinImage = createAboutActionIcon(
    RUBRIC_IMAGE_PATH,
    JOIN_LINK,
    "Join",
    "#FF5757",
  );
  aboutActionIcons = [
    aboutJoinImage,
    createAboutActionIcon(
      PROSPECTUS_IMAGE_PATH,
      PROSPECTUS_LINK,
      "Sponsor",
      "#4EA8FF",
    ),
    createAboutActionIcon(BLOG_IMAGE_PATH, BLOG_LINK, "Blog", "#FFF3D2"),
  ];
  applyAboutJoinImageLayout();
}

function stopRubricsDance() {
  if (!aboutJoinImage) return;
  if (aboutJoinImage.userData.danceTween) {
    aboutJoinImage.userData.danceTween.kill();
    aboutJoinImage.userData.danceTween = null;
  }
  aboutJoinImage.position.x = aboutJoinImage.userData.baseX ?? ABOUT_IMAGE_POS.x;
}

function startRubricsDance() {
  if (!aboutJoinImage || prefersReducedMotion.matches) return;
  stopRubricsDance();
  const baseX = aboutJoinImage.userData.baseX ?? ABOUT_IMAGE_POS.x;
  aboutJoinImage.userData.danceTween = gsap.to(aboutJoinImage.position, {
    x: baseX + 0.22,
    duration: 0.16,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}

function stopAboutJoinHover() {
  if (!aboutJoinImage) return;

  stopRubricsDance();
  gsap.killTweensOf(aboutJoinImage.position);
  gsap.killTweensOf(aboutJoinImage.scale);
  aboutJoinImage.userData.hovered = false;
  aboutJoinImage.userData.tiltZ = 0;
  aboutJoinImage.scale.set(1, 1, 1);
  aboutJoinImage.position.y =
    aboutJoinImage.userData.baseY ?? aboutJoinImage.position.y;
  document.body.removeAttribute("data-content-hover");
}

function setAboutJoinVisible(visible) {
  if (aboutActionIcons.length === 0) return;

  if (!visible) {
    aboutActionIcons.forEach((icon) => setAboutIconHovered(icon, false));
    stopAboutJoinHover();
  }
  aboutActionIcons.forEach((icon) => {
    icon.visible = visible;
    icon.material.opacity = visible ? 1 : 0;
  });
}

function setAboutIconHovered(icon, hovered) {
  if (!icon || icon.userData.hovered === hovered) return;

  icon.userData.hovered = hovered;
  gsap.killTweensOf(icon.scale);
  gsap.to(icon.scale, {
    x: hovered ? 1.035 : 1,
    y: hovered ? 1.035 : 1,
    z: hovered ? 1.035 : 1,
    duration: motionDuration(0.12),
    ease: hovered ? "back.out(2)" : "power2.out",
  });
}

function updateAboutJoinHover() {
  if (
    currentIndex !== ABOUT_SECTION_INDEX ||
    isAnimating ||
    !aboutActionIcons.some((icon) => icon.visible)
  ) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const visibleIcons = aboutActionIcons.filter((icon) => icon.visible);
  const hit = raycaster.intersectObjects(visibleIcons)[0]?.object ?? null;

  setAboutJoinImageHovered(hit === aboutJoinImage);
  aboutActionIcons.forEach((icon) => {
    if (icon !== aboutJoinImage) setAboutIconHovered(icon, icon === hit);
  });

  canvas.style.cursor = hit ? "pointer" : "default";
}

function setAboutJoinImageHovered(hovered) {
  if (!aboutJoinImage || aboutJoinImage.userData.hovered === hovered) return;

  gsap.killTweensOf(aboutJoinImage.position);
  gsap.killTweensOf(aboutJoinImage.scale);
  aboutJoinImage.userData.hovered = hovered;
  const baseY = aboutJoinImage.userData.baseY ?? aboutJoinImage.position.y;

  if (hovered) {
    document.body.dataset.contentHover = "join";
    startRubricsDance();
    gsap.to(aboutJoinImage.scale, {
      x: 1.035,
      y: 1.035,
      z: 1.035,
      duration: motionDuration(0.12),
      ease: "back.out(2)",
    });
  } else {
    document.body.removeAttribute("data-content-hover");
    stopRubricsDance();
    aboutJoinImage.userData.tiltZ = 0;
    gsap.to(aboutJoinImage.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: motionDuration(0.12),
      ease: "power2.out",
    });
  }

  gsap.to(aboutJoinImage.position, {
    y: baseY,
    duration: motionDuration(0.12),
    ease: "power2.out",
  });
}

function navigateJoinTarget(url) {
  if (!url) return;
  if (/^https?:/i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(url);
}

function celebrateAndNavigateJoin(url) {
  if (!url) return;
  navigateJoinTarget(url);
}

function setupAboutJoinInteraction() {
  canvas.addEventListener("click", (event) => {
    if (currentIndex !== ABOUT_SECTION_INDEX || isAnimating) return;

    updatePointerFromEvent(event);

    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(
      aboutActionIcons.filter((icon) => icon.visible),
    )[0]?.object;

    if (!hit) return;

    if (hit === aboutJoinImage) celebrateAndNavigateJoin(hit.userData.url);
    else navigateJoinTarget(hit.userData.url);
  });
}

function triggerJoinHoverFromKeyboard(active) {
  setAboutJoinImageHovered(active);
}

function setupJoinAccessibleInteraction() {
  if (!joinUsAccessibleLink) return;

  joinUsAccessibleLink.addEventListener("focus", () =>
    triggerJoinHoverFromKeyboard(true),
  );
  joinUsAccessibleLink.addEventListener("blur", () =>
    triggerJoinHoverFromKeyboard(false),
  );
  joinUsAccessibleLink.addEventListener("click", (event) => {
    event.preventDefault();
    celebrateAndNavigateJoin(joinUsAccessibleLink.href || JOIN_LINK);
  });
  joinUsAccessibleLink.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    celebrateAndNavigateJoin(joinUsAccessibleLink.href || JOIN_LINK);
  });
}

function getCommitteeMemberPosition(group, rowIndex, colIndex, indexInGroup) {
  const layout = getViewportLayout();
  const rowLength = group.rows[rowIndex].length;
  let xOffset;
  let y;

  if (layout.committeeMobileRows && group.kind === "exec") {
    let row = 0;
    let firstIndex = 0;

    while (
      row < layout.committeeMobileRows.length - 1 &&
      indexInGroup >= firstIndex + layout.committeeMobileRows[row]
    ) {
      firstIndex += layout.committeeMobileRows[row];
      row += 1;
    }

    const rowLengthForIndex = layout.committeeMobileRows[row];
    const col = indexInGroup - firstIndex;

    xOffset =
      (col - (rowLengthForIndex - 1) / 2) * layout.committeeImageSpacing;
    y = layout.committeeBaseY - row * layout.committeeRowSpacing;
  } else if (layout.compact && group.kind === "general") {
    const perRow = 3;
    const total = group.rows[0].length;
    const row = Math.floor(indexInGroup / perRow);
    const rowLengthForIndex = Math.min(perRow, total - row * perRow);
    const col = indexInGroup - row * perRow;

    xOffset =
      (col - (rowLengthForIndex - 1) / 2) * layout.committeeImageSpacing;
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

  caption.text = committeeCaptionLabel(title);
  caption.font = DESCRIPTION_FONT;
  caption.fontSize = layout.committeeCaptionFontSize;
  caption.maxWidth = layout.committeeImageSpacing * 0.92;
  caption.color = 0xffffff;
  caption.anchorX = "center";
  caption.anchorY = "top";
  caption.textAlign = "center";
  caption.fillOpacity = 0;
  caption.userData.baseY =
    position.y - imageHeight / 2 - COMMITTEE_CAPTION_GAP;
  caption.position.set(position.x, caption.userData.baseY, position.z);
  caption.visible = false;
  caption.sync();

  addToSection(COMMITTEE_SECTION_INDEX, caption);
  return caption;
}

function createCommitteeMembers() {
  const members = [];
  let memberIndex = 0;

  COMMITTEE_GROUPS.forEach((group, groupIndex) => {
    let indexInGroup = 0;

    group.rows.forEach((row, rowIndex) => {
      row.forEach((config, colIndex) => {
        const position = getCommitteeMemberPosition(
          group,
          rowIndex,
          colIndex,
          indexInGroup,
        );
        const material = createRoundedImageMaterial();
        const image = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

        image.position.set(position.x, position.y, position.z);
        image.userData.baseX = position.x;
        image.userData.url = config.url;
        image.userData.name = config.name;
        image.userData.title = config.title;
        image.userData.image = config.image;
        image.userData.accentColor = config.accentColor;
        image.userData.pathVariant = config.pathVariant;
        image.userData.roleSlug = config.roleSlug;
        image.userData.memberIndex = memberIndex;
        image.userData.texturePath = config.image;
        image.userData.groupIndex = groupIndex;
        image.userData.layout = {
          rowIndex,
          colIndex,
          rowLength: row.length,
          memberIndex,
        };
        image.userData.baseY = position.y;
        image.visible = false;
        addToSection(COMMITTEE_SECTION_INDEX, image);

        const caption = createCommitteeCaption(
          config.title,
          position,
          getViewportLayout().committeeImageHeight,
        );
        caption.userData.layout = image.userData.layout;
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
          accentColor: config.accentColor,
          pathVariant: config.pathVariant,
          roleSlug: config.roleSlug,
          sourceImage: config.image,
          photoFocus: config.photoFocus,
          photoWidth: config.photoWidth,
          photoHeight: config.photoHeight,
          groupIndex,
          indexInGroup,
          rowIndex,
          colIndex,
          rowLength: row.length,
          memberIndex,
        });
        memberIndex += 1;
        indexInGroup += 1;
      });
    });
  });

  return members;
}

function committeeCaptionLabel(title = "") {
  const layout = getViewportLayout();

  if (!layout.compact) return title;

  return title.replace(/\s+Director$/i, "").trim() || title;
}

function applyCommitteeLayout() {
  const layout = getViewportLayout();

  committeeMembers.forEach((member) => {
    const group = COMMITTEE_GROUPS[member.groupIndex];
    if (!group) return;

    const position = getCommitteeMemberPosition(
      group,
      member.rowIndex,
      member.colIndex,
      member.indexInGroup,
    );

    const captionY =
      position.y - layout.committeeImageHeight / 2 - COMMITTEE_CAPTION_GAP;
    const captionLabel = committeeCaptionLabel(member.title);
    const layoutKey = [
      position.x,
      position.y,
      position.z,
      layout.committeeImageHeight,
      layout.committeeImageSpacing,
      layout.committeeCaptionFontSize,
      layout.compact,
    ].join("|");

    if (member.image.userData.committeeLayoutKey === layoutKey) return;

    member.image.userData.committeeLayoutKey = layoutKey;
    member.image.position.set(position.x, position.y, position.z);
    member.image.userData.baseX = position.x;
    member.image.userData.baseY = position.y;
    resizeAvatarPlane(member.image, layout.committeeImageHeight);

    if (member.caption.text !== captionLabel) {
      member.caption.text = captionLabel;
      member.caption.sync();
    }

    member.caption.fontSize = layout.committeeCaptionFontSize;
    member.caption.maxWidth = layout.committeeImageSpacing * 0.92;
    member.caption.userData.baseY = captionY;
    member.caption.position.set(position.x, captionY, position.z);
    member.caption.sync();
  });
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
        member.image.userData.aspect =
          texture.image.width / texture.image.height;
        coverSquareTexture(
          texture,
          member.image.userData.aspect,
          member.photoFocus,
        );
        applyCommitteeLayout();
        resolve();
      },
      undefined,
      reject,
    );
  });

  return member.image.userData.texturePromise;
}

function preloadCommitteeTextures() {
  return Promise.allSettled(committeeMembers.map(loadCommitteeMemberTexture));
}

function getVisibleCommitteeImages() {
  return committeeMembers
    .map((member) => member.image)
    .filter((image) => image.visible);
}

function setCommitteeImageHovered(image) {
  if (hoveredCommitteeImage === image) return;

  if (hoveredCommitteeImage) {
    gsap.killTweensOf(hoveredCommitteeImage.scale);
    hoveredCommitteeImage.userData.caption.color = 0xffffff;
    hoveredCommitteeImage.userData.caption.sync();
    gsap.to(hoveredCommitteeImage.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: motionDuration(0.12),
      ease: "power2.out",
    });
  }

  hoveredCommitteeImage = image;
  document.body.style.removeProperty("--committee-accent");
  document.body.removeAttribute("data-committee-group");
  document.body.removeAttribute("data-path-variant");
  document.body.removeAttribute("data-content-hover");

  if (hoveredCommitteeImage) {
    const profile = getCommitteeHoverProfile(
      hoveredCommitteeImage.userData.roleSlug,
    );
    const accent = hoveredCommitteeImage.userData.accentColor || "#FF5757";
    document.body.style.setProperty("--committee-accent", accent);
    document.body.dataset.contentHover = "committee";
    document.body.dataset.committeeGroup =
      hoveredCommitteeImage.userData.layout.rowIndex === 0 ? "role" : "content";
    document.body.dataset.pathVariant =
      hoveredCommitteeImage.userData.pathVariant || "underline-swoop";
    hoveredCommitteeImage.userData.caption.color = accent;
    hoveredCommitteeImage.userData.caption.sync();
    gsap.killTweensOf(hoveredCommitteeImage.scale);
    gsap.to(hoveredCommitteeImage.scale, {
      x: profile.scale,
      y: profile.scale,
      z: profile.scale,
      duration: motionDuration(0.12),
      ease: "back.out(2)",
    });
  }
}

function updateCommitteeHover() {
  if (isAnimating || committeeMembers.length === 0) return;

  const visibleImages = getVisibleCommitteeImages();
  if (visibleImages.length === 0) {
    if (currentIndex === COMMITTEE_SECTION_INDEX) {
      setCommitteeImageHovered(null);
    }
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(visibleImages);

  setCommitteeImageHovered(intersects[0]?.object ?? null);
  canvas.style.cursor = intersects.length > 0 ? "pointer" : "default";
}

function setupCommitteeInteraction() {
  canvas.addEventListener("click", (event) => {
    if (isAnimating || getVisibleCommitteeImages().length === 0) return;

    updatePointerFromEvent(event);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getVisibleCommitteeImages());

    if (intersects.length > 0) {
      lastMemberTrigger = canvas;
      openMemberPopup(
        intersects[0].object.userData.memberIndex,
        intersects[0].object,
      );
    }
  });
}

function getSocialCubeBasePosition(index) {
  const layout = getViewportLayout();

  if (layout.socialDice) {
    // Dice-5 arrangement on mobile: 2 corners, centre, 2 corners.
    // ponytail: extra socials (index > 4) wrap onto the same slots.
    const spread = layout.socialDiceSpacing / 2;
    const step = layout.socialDiceRowStep;
    const slots = [
      { x: -spread, y: step },
      { x: spread, y: step },
      { x: 0, y: 0 },
      { x: -spread, y: -step },
      { x: spread, y: -step },
    ];
    const slot = slots[index % slots.length];

    return {
      x: SOCIAL_CUBE_BASE.x + slot.x,
      y: layout.socialCubeY + slot.y,
      z: SOCIAL_CUBE_BASE.z,
    };
  }

  const xOffset =
    (index - (SOCIAL_CUBES.length - 1) / 2) * layout.socialCubeSpacing;

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
  card.geometry = new RoundedBoxGeometry(
    layout.socialCardWidth,
    layout.socialCardHeight,
    SOCIAL_CARD_DEPTH,
    SOCIAL_CUBE_SEGMENTS,
    SOCIAL_CUBE_RADIUS,
  );
  card.userData.width = layout.socialCardWidth;
  card.userData.height = layout.socialCardHeight;

  if (card.userData.caption) {
    card.userData.caption.fontSize = layout.narrow
      ? 0.5
      : layout.compact
        ? 0.56
        : 0.64;
    card.userData.caption.position.set(
      0,
      -layout.socialCardHeight / 2 - 0.42,
      SOCIAL_CARD_DEPTH / 2 + 0.04,
    );
    card.userData.caption.sync();
  }

  if (card.userData.logoMesh) {
    card.userData.logoMesh.geometry.dispose();
    card.userData.logoMesh.geometry = new THREE.PlaneGeometry(
      layout.socialCardWidth,
      layout.socialCardHeight,
      48,
      48,
    );
  }

  if (card.userData.underline) {
    card.userData.underline.geometry.dispose();
    card.userData.underline.geometry = new THREE.PlaneGeometry(
      layout.socialCardWidth * 0.56,
      0.055,
    );
    card.userData.underline.position.set(
      0,
      -layout.socialCardHeight / 2 - 0.28,
      SOCIAL_CARD_DEPTH / 2 + 0.055,
    );
  }
}

function applySocialCubeLayout() {
  socialCubes.forEach((cube) => {
    const basePosition = getSocialCubeBasePosition(cube.userData.socialIndex);

    cube.userData.baseX = basePosition.x;
    cube.userData.baseY = basePosition.y;
    resizeSocialCard(cube);
    cube.position.set(basePosition.x, basePosition.y, basePosition.z);
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
  caption.position.set(
    0,
    -layout.socialCardHeight / 2 - 0.42,
    SOCIAL_CARD_DEPTH / 2 + 0.04,
  );
  caption.raycast = () => { };
  caption.sync();

  return caption;
}

let socialCubesReady = false;

function warmSocialCubeMaterials() {
  if (socialCubes.length === 0) return;

  const previous = socialCubes.map((cube) => cube.visible);

  socialCubes.forEach((cube) => {
    cube.visible = true;
  });

  try {
    renderer.compile(scene, camera);
  } catch { }

  socialCubes.forEach((cube, index) => {
    cube.visible = previous[index];
  });
}

function ensureSocialCubes() {
  if (socialCubesReady) return socialCubes;

  socialCubesReady = true;
  socialCubes = createSocialCubes();
  applySocialCubeLayout();
  exposeSocialMaterialTestState();
  warmSocialCubeMaterials();

  return socialCubes;
}

function scheduleSocialCubeWarmup() {
  const idle =
    typeof window.requestIdleCallback === "function"
      ? (callback) => window.requestIdleCallback(callback, { timeout: 2500 })
      : (callback) => window.setTimeout(callback, 900);

  idle(() => ensureSocialCubes());
}

function createSocialCubes() {
  return SOCIAL_CUBES.map((config, index) => {
    const texture = createSocialTexture(config);
    const basePosition = getSocialCubeBasePosition(index);
    const layout = getViewportLayout();
    const materialKey = config.material || config.label;
    const touchField = createMaterialTouchField(materialKey);
    const cube = new THREE.Mesh(
      new RoundedBoxGeometry(
        layout.socialCardWidth,
        layout.socialCardHeight,
        SOCIAL_CARD_DEPTH,
        SOCIAL_CUBE_SEGMENTS,
        SOCIAL_CUBE_RADIUS,
      ),
      createSocialCardMaterials(texture, materialKey, touchField),
    );
    const caption = createSocialCaption(config.label);
    const logoMesh = createSocialLogoMesh(
      texture,
      materialKey,
      touchField,
      layout,
    );
    const underline = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.socialCardWidth * 0.56, 0.055),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.accent || "#ff5757"),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );

    cube.position.set(basePosition.x, basePosition.y, basePosition.z);
    cube.userData.url = config.url;
    cube.userData.label = config.label;
    cube.userData.material = config.material;
    cube.userData.accent = config.accent;
    cube.userData.materialKind = touchField.config.kind;
    cube.userData.touchField = touchField;
    cube.userData.socialIndex = index;
    cube.userData.width = layout.socialCardWidth;
    cube.userData.height = layout.socialCardHeight;
    cube.userData.caption = caption;
    cube.userData.logoMesh = logoMesh;
    cube.userData.underline = underline;
    cube.userData.baseX = cube.position.x;
    cube.userData.baseY = cube.position.y;
    cube.userData.hovered = false;
    cube.userData.growTween = null;
    cube.visible = false;
    cube.scale.set(
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN,
      SOCIAL_CUBE_SCALE_MIN,
    );
    underline.position.set(
      0,
      -layout.socialCardHeight / 2 - 0.28,
      SOCIAL_CARD_DEPTH / 2 + 0.055,
    );
    underline.userData.isSocialUnderline = true;
    underline.renderOrder = 42;
    cube.add(logoMesh);
    cube.add(underline);
    cube.add(caption);
    addToSection(CONTACT_SECTION_INDEX, cube);
    return cube;
  });
}

function exposeCommitteeTestState() {
  if (!window.Cypress) return;

  window.__uqrlCommitteeMembers = () =>
    committeeMembers
      .filter((member) => member.image.visible)
      .map((member) => {
        const bounds = getObjectScreenBounds(member.image);
        return {
          index: member.memberIndex,
          name: member.name,
          groupIndex: member.groupIndex,
          hovered: member.image === hoveredCommitteeImage,
          scale: member.image.scale.x,
          center: bounds.center,
          bounds: {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom,
          },
        };
      });
}

function exposeSocialMaterialTestState() {
  if (!window.Cypress) return;

  window.__uqrlSocialMaterials = () => {
    const point = new THREE.Vector3();

    return socialCubes.map((cube) => {
      cube.getWorldPosition(point);
      point.project(camera);
      return {
        label: cube.userData.label,
        kind: cube.userData.touchField?.config?.kind,
        visible: cube.visible,
        hasLogo: Boolean(cube.userData.logoMesh),
        hasUnderline: Boolean(cube.userData.underline),
        logoFillRatio: cube.userData.logoMesh
          ? Math.min(
            (cube.userData.logoMesh.geometry?.parameters?.width || 0) /
            (cube.userData.width || 1),
            (cube.userData.logoMesh.geometry?.parameters?.height || 0) /
            (cube.userData.height || 1),
          )
          : 0,
        underlineScaleY: cube.userData.underline?.scale?.y || 0,
        pressure: cube.userData.touchField?.poke?.pressure || 0,
        screenX: canvasRect.left + (point.x * 0.5 + 0.5) * canvasRect.width,
        screenY: canvasRect.top + (-point.y * 0.5 + 0.5) * canvasRect.height,
      };
    });
  };
}

function stopSocialCubeGrow(cube) {
  if (cube.userData.growTween) {
    cube.userData.growTween.kill();
    cube.userData.growTween = null;
  }

  gsap.killTweensOf(cube.position, "y,z");
  gsap.killTweensOf(cube.rotation);
}

function setSocialCubeHovered(cube, hovered) {
  stopSocialCubeGrow(cube);
  const profile = getSocialHoverProfile(cube.userData.label || "");

  if (hovered) {
    cube.userData.growTween = gsap.to(cube.scale, {
      x: SOCIAL_CUBE_SCALE_MAX * profile.scaleX,
      y: SOCIAL_CUBE_SCALE_MAX * profile.scaleY,
      z: SOCIAL_CUBE_SCALE_MAX * profile.scaleZ,
      duration: 0.2,
      ease: "back.out(1.8)",
    });
    gsap.to(cube.position, {
      z: SOCIAL_CUBE_BASE.z + profile.z,
      y: cube.userData.baseY + profile.lift,
      duration: 0.2,
      ease: "power2.out",
    });
    gsap.to(cube.rotation, {
      z: (cube.userData.socialIndex % 2 === 0 ? 0.04 : -0.04) + profile.rotate,
      duration: 0.2,
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
      y: cube.userData.baseY,
      duration: 0.22,
      ease: "power2.out",
    });
    gsap.to(cube.rotation, {
      z: 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }

  cube.userData.hovered = hovered;
}

function resetSocialCubeTransform(cube) {
  cube.position.set(
    cube.userData.baseX,
    cube.userData.baseY,
    SOCIAL_CUBE_BASE.z,
  );
  cube.rotation.set(0, 0, 0);
}

function setSocialCubesVisible(visible) {
  socialCubes.forEach((cube) => {
    stopSocialCubeGrow(cube);
    resetSocialCubeTransform(cube);
    cube.scale.setScalar(SOCIAL_CUBE_SCALE_MIN);
    cube.visible = visible;
  });

  pointerDirty = true;

  if (visible) {
    document.body.dataset.socialMaterialsReady = "true";
    return;
  }

  canvas.style.cursor = "default";
  document.body.dataset.socialMaterialsReady = "false";
  document.body.removeAttribute("data-content-hover");
  document.body.removeAttribute("data-material-type");
  document.body.removeAttribute("data-pointer-active");
  document.body.removeAttribute("data-interaction-state");
  document.body.removeAttribute("data-active-material");
  document.body.dataset.pokeState = "idle";
}

function resetSocialCubeHover(cube) {
  setSocialCubeHovered(cube, false);
}

function getSocialCubeFromObject(object) {
  let current = object;
  while (current) {
    if (socialCubes.includes(current)) return current;
    current = current.parent;
  }
  return null;
}

function getSocialTouchUv(cube, hit) {
  if (!cube || !hit) return null;
  if (hit.object.userData?.isSocialLogo && hit.uv) return hit.uv;
  if (hit.object.userData?.isSocialUnderline) {
    const local = hit.object.worldToLocal(hit.point.clone());
    const width = cube.userData.width * 0.56 || 1;
    return new THREE.Vector2(
      THREE.MathUtils.clamp(local.x / width + 0.5, 0, 1),
      0.08,
    );
  }
  if (hit.object !== cube) return null;

  const local = cube.worldToLocal(hit.point.clone());
  const width = cube.userData.width || 1;
  const height = cube.userData.height || 1;
  return new THREE.Vector2(
    THREE.MathUtils.clamp(local.x / width + 0.5, 0, 1),
    THREE.MathUtils.clamp(local.y / height + 0.5, 0, 1),
  );
}

function updateSocialMaterialTouchFields() {
  if (
    currentIndex !== CONTACT_SECTION_INDEX ||
    !socialCubes.some((cube) => cube.visible)
  ) {
    return;
  }

  socialCubes.forEach((cube) => {
    updateMaterialTouchField(cube.userData.touchField);

    const pressure = cube.userData.touchField?.poke?.pressure || 0;
    if (cube.userData.caption) {
      cube.userData.caption.position.y =
        -((cube.userData.height || 1) / 2) - 0.42 - pressure * 0.05;
    }
    if (cube.userData.underline) {
      cube.userData.underline.scale.set(1 + pressure * 0.14, 1 + pressure * 0.4, 1);
      cube.userData.underline.material.opacity = 0.72 + pressure * 0.25;
    }
  });
}

function findProjectedSocialCubeHit(visibleCubes) {
  if (!Number.isFinite(lastPointerClientX)) return null;

  const point = new THREE.Vector3();
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  visibleCubes.forEach((cube) => {
    cube.getWorldPosition(point);
    point.project(camera);
    const screenX = canvasRect.left + (point.x * 0.5 + 0.5) * canvasRect.width;
    const screenY = canvasRect.top + (-point.y * 0.5 + 0.5) * canvasRect.height;
    const distance = Math.hypot(
      screenX - lastPointerClientX,
      screenY - lastPointerClientY,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = {
        cube,
        point: cube.getWorldPosition(new THREE.Vector3()),
        uv: new THREE.Vector2(0.5, 0.5),
      };
    }
  });

  return nearestDistance <= 90 ? nearest : null;
}

function updateSocialCubeHover() {
  if (
    currentIndex !== CONTACT_SECTION_INDEX ||
    !socialCubes.some((cube) => cube.visible)
  ) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const visibleCubes = socialCubes.filter((cube) => cube.visible);
  const intersects = raycaster.intersectObjects(visibleCubes, true);
  let hoveredHit = intersects[0] ?? null;
  let hoveredCube = hoveredHit ? getSocialCubeFromObject(hoveredHit.object) : null;
  const projectedHit = hoveredCube
    ? null
    : findProjectedSocialCubeHit(visibleCubes);
  if (projectedHit) {
    hoveredCube = projectedHit.cube;
    hoveredHit = projectedHit;
  }
  let pointerActive = false;

  visibleCubes.forEach((cube) => {
    if (cube === hoveredCube) {
      pointerActive = true;
      document.body.dataset.contentHover = "social";
      document.body.style.setProperty(
        "--content-accent",
        cube.userData.accent || "#ff5757",
      );

      if (!cube.userData.hovered) {
        setSocialCubeHovered(cube, true);
      }

      if (hoveredHit) {
        const touchUv =
          projectedHit && hoveredHit === projectedHit
            ? projectedHit.uv
            : getSocialTouchUv(cube, hoveredHit);
        const pressure = pointerIsDown
          ? Math.max(pointerPressure, lastPointerType === "touch" ? 0.85 : 0.75)
          : Math.max(pointerPressure, 0.25);
        stampMaterialTouch(cube.userData.touchField, touchUv, hoveredHit.point, pressure);
        document.body.dataset.materialType = cube.userData.materialKind;
        document.body.dataset.activeMaterial = cube.userData.materialKind;
        document.body.dataset.pointerActive = "true";
        document.body.dataset.interactionState = pointerIsDown ? "pressed" : "hover";
        document.body.dataset.pokeState = pointerIsDown ? "pressed" : "hover";
      }
    } else if (cube.userData.hovered) {
      resetSocialCubeHover(cube);
    }
  });

  if (!pointerActive) {
    document.body.removeAttribute("data-content-hover");
    document.body.removeAttribute("data-material-type");
    document.body.removeAttribute("data-pointer-active");
    document.body.removeAttribute("data-interaction-state");
    document.body.removeAttribute("data-active-material");
    document.body.dataset.pokeState = "idle";
    document.body.style.removeProperty("--content-accent");
  }

  canvas.style.cursor = pointerActive ? "pointer" : "default";
}

function clearCanvasPointerHover() {
  pointerIsDown = false;
  pointerPressure = 0;
  lastPointerClientX = Number.NEGATIVE_INFINITY;
  lastPointerClientY = Number.NEGATIVE_INFINITY;
  mouse.set(2, 2);
  pointerDirty = true;
  canvas.style.cursor = "default";

  if (aboutJoinImage?.userData.hovered) {
    setAboutJoinImageHovered(false);
  }
  aboutActionIcons.forEach((icon) => {
    if (icon !== aboutJoinImage) setAboutIconHovered(icon, false);
  });

  socialCubes.forEach((cube) => {
    if (cube.userData.hovered) resetSocialCubeHover(cube);
  });
  document.body.removeAttribute("data-content-hover");
  document.body.removeAttribute("data-material-type");
  document.body.removeAttribute("data-pointer-active");
  document.body.removeAttribute("data-interaction-state");
  document.body.removeAttribute("data-active-material");
  document.body.dataset.pokeState = "idle";
  document.body.style.removeProperty("--content-accent");
}

function setupSocialCubeInteraction() {
  canvas.addEventListener("pointermove", updatePointerFromEvent, {
    passive: true,
  });
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      pointerIsDown = true;
      pointerPressure = Math.max(event.pressure || 0, 0.55);
      lastPointerType = event.pointerType || lastPointerType;
      updatePointerFromEvent(event);
    },
    { passive: true },
  );
  window.addEventListener(
    "pointerup",
    () => {
      pointerIsDown = false;
      pointerPressure = 0;
    },
    { passive: true },
  );
  canvas.addEventListener(
    "pointerleave",
    clearCanvasPointerHover,
    { passive: true },
  );
  window.addEventListener("blur", clearCanvasPointerHover, { passive: true });

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
      socialCubes.filter((cube) => cube.visible),
      true,
    );

    if (intersects.length > 0) {
      const cube = getSocialCubeFromObject(intersects[0].object);
      const url = cube?.userData.url;
      if (!url) return;
      if (url.startsWith("mailto:")) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  });
}

function animateModelEntrance(modelSize) {
  if (!modelGroup) return;

  const sectionPos = getCurrentSectionPos();
  const finalY = sectionPos.y;
  const startY = finalY - modelSize * MODEL_ENTRANCE_OFFSET_FACTOR;
  const animPos = { y: startY };

  isAnimating = true;
  modelGroup.position.set(sectionPos.x, startY, sectionPos.z);

  gsap.to(animPos, {
    y: finalY,
    duration: MODEL_ENTRANCE_DURATION,
    ease: MODEL_ENTRANCE_EASE,
    onUpdate: () => {
      modelGroup.position.y = animPos.y;
      aimLightsAtModel();
    },
    onComplete: async () => {
      const latestSectionPos = getCurrentSectionPos();
      modelGroup.position.set(
        latestSectionPos.x,
        latestSectionPos.y,
        latestSectionPos.z,
      );
      aimLightsAtModel();
      isAnimating = false;
      entranceComplete = true;
      markSceneReady();
      setActiveStop(activeStop < 0 ? 0 : activeStop, true);
      updateScrollPosition();
      pointerDirty = true;
      logModelPosition("Model (entrance complete)");
    },
  });
}

function restoreModelMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;

    child.geometry.computeVertexNormals();
    child.material.map = null;
    child.material.emissiveMap = null;
    child.material.roughness = 0.18;
    child.material.metalness = 0.58;
    child.material.clearcoat = 0.86;
    child.material.clearcoatRoughness = 0.08;
    child.material.envMapIntensity = 1.1;
    child.material.emissive.set(0x07090f);
    child.material.emissiveIntensity = 0.12;
    child.material.needsUpdate = true;
  });
}

async function loadSceneModel() {
  try {
    const gltf = await loader.loadAsync(MODEL_PATH);

    modelGroup = new THREE.Group();

    restoreModelMaterials(gltf.scene);
    modelGroup.add(gltf.scene);
    modelGroup.scale.setScalar(MODEL_SCALE);
    scene.add(modelGroup);

    applyModelRotation();

    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    modelCenter.copy(center);
    modelSizeMax = maxSize;
    modelLookHeight = size.y * 0.35;
    baseCamLeftOffset = maxSize * CAM_LEFT_FACTOR;
    baseCamHeightOffset = maxSize * CAM_HEIGHT_FACTOR;
    baseCameraZ = maxSize * CAM_DISTANCE_FACTOR;
    camera.near = Math.max(maxSize / 100, 0.01);
    camera.far = Math.max(maxSize * 100, CAM_FAR);
    // Camera-dependent layout metrics are now known: rebuild in one pass.
    cachedViewportLayout = null;
    applyCameraLayout();
    applyResponsiveLayout();

    rainbowBackdrop = createRainbowBackdrop(maxSize);

    reportSceneProgress(0.94);
    setCameraOnModel(getCurrentSectionPos());
    animateModelEntrance(maxSize);
    aimLightsAtModel();
    updateStatus();
    logModelPosition("Model (loaded)");
  } catch (error) {
    console.error("Failed to load GLB:", error);
    markSceneReady();
  }
}

let resizeFrame = 0;
let lastResizeWidth = window.innerWidth;

function onResize() {
  updateViewportSize();
  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(viewportWidth, viewportHeight, false);

  stableViewportHeight = viewportHeight;
  cachedViewportLayout = null;
  resizeScrollTrack();
  applyCameraLayout();
  applyResponsiveLayout();
  refreshMemberPopupPosition();
}

function queueResize() {
  if (resizeFrame) return;

  // Mobile browsers animate the address bar while scrolling, firing resize
  // events that only change the viewport height. Re-sizing the canvas buffer
  // and re-deriving the responsive layout on each of those is what flashes and
  // jitters text mid-scroll. Keep the boot-time height on mobile and only
  // relayout when the width changes (orientation change). Desktop is unchanged.
  const nextWidth = window.innerWidth;
  if (isMobileUserAgent() && nextWidth === lastResizeWidth) return;
  lastResizeWidth = nextWidth;

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    onResize();
  });
}

window.addEventListener("resize", queueResize, { passive: true });
window.visualViewport?.addEventListener("resize", queueResize, {
  passive: true,
});
window.visualViewport?.addEventListener("scroll", refreshMemberPopupPosition, {
  passive: true,
});

if ("ResizeObserver" in window) {
  resizeObserver = new ResizeObserver(queueResize);
  resizeObserver.observe(canvas);
}

function animate() {
  animationFrame = requestAnimationFrame(animate);

  updateScrollPosition();
  applyPointerMotion();
  animateRainbowBackdrop();
  updateSocialMaterialTouchFields();
  updateSocialCubeHover();
  updateAboutJoinHover();
  updateCommitteeHover();
  pointerDirty = false;

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

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;

  stopAnimationLoop();
  resizeObserver?.disconnect();
  prefersReducedMotion.removeEventListener?.("change", syncReducedMotionState);

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = 0;
  }
});

async function init() {
  reportSceneProgress(0.04);
  await loadSiteContent();
  setupAccessibleContentLinks();
  reportSceneProgress(0.1);
  const committeeYears = await loadCommitteeYears();
  COMMITTEE_GROUPS = buildCommitteeGroups(committeeYears);
  buildScrollStops();
  resizeScrollTrack();
  createSectionGroups();
  initSectionTexts();
  sponsorImage = createSponsorImage();
  createAboutActionIcons();
  committeeMembers = createCommitteeMembers();
  ensureSocialCubes();
  setupNavbar();
  buildYearRail();
  setupMemberPopup();
  applyResponsiveLayout();
  exposeSocialMaterialTestState();
  exposeCommitteeTestState();
  setupJoinAccessibleInteraction();
  setupSocialCubeInteraction();
  setupAboutJoinInteraction();
  setupCommitteeInteraction();
  await preloadCommitteeTextures();
  await waitForAssets();
  window.scrollTo(0, 0);
  setActiveStop(0, true);
  await loadSceneModel();
  scheduleSocialCubeWarmup();

  if (!document.hidden) {
    startAnimationLoop();
  }
}

init().catch((error) => {
  console.error("Failed to start site:", error);
  markSceneReady();
  if (DEBUG && statusLabel) {
    statusLabel.hidden = false;
    statusLabel.textContent = "Failed to load";
  }
});
