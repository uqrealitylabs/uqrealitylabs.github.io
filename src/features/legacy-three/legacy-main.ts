// @ts-nocheck
import { gsap } from "gsap";
import { Observer } from "gsap/all";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Text } from "troika-three-text";
import { getPageContent, getSiteContent } from "../../content/contentRegistry";
import {
  JOIN_US_BLUSH_DELAY_MS,
  JOIN_US_NAVIGATION_DELAY_MS,
  constrainPupilOffset,
  getOrganicWinkDelayMs,
  joinUsStates,
} from "../living-join-us/joinUsState";
import {
  getSocialMaterialConfig,
  getSocialMaterialKind,
} from "../social-materials/materialConfig";
import {
  applyPoke,
  createPokeState,
  getPokeInfluence,
  getPokeVelocity,
  stepPoke,
} from "../social-materials/socialPokeModel";

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
const CAM_DISTANCE_FACTOR = 0.2;
const CAM_LEFT_FACTOR = 0.0;
const CAM_HEIGHT_FACTOR = 0.05;

const SCROLL_DURATION = 1;
const SCROLL_TOLERANCE = 30;
const STAR_COUNT = 90;
const STAR_RADIUS = 0.16;
const STAR_DRIFT_DISTANCE = 200;
const SECTION_Y_STEP = 200;
const TEXT_FONT_SIZE = 1.84;
const TEXT_MAX_WIDTH = 40;
const TEXT_REVEAL_DURATION = 0.42;
const TEXT_HIDE_DURATION = 0.22;
const DESCRIPTION_Y_OFFSET = -5;
const DESCRIPTION_FONT_SIZE = 1.12;
const COMPACT_VIEWPORT_WIDTH = 860;
const SHORT_VIEWPORT_HEIGHT = 680;
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

async function loadCommitteeRows() {
  const site = getSiteContent(currentLocale());
  const manifest = site.committee || {};
  const membersByRole = new Map();
  const roleSlugs = manifest.roles || [
    ...new Set((manifest.rows || []).flat()),
  ];

  roleSlugs.forEach((slug) => {
    const role = site.roles?.[slug];
    if (!role) return;
    const roleColor = role.accentColor || role.accentColors?.[0] || "#FF5757";
    const roleMusic = role.music || null;
    const members = (role.members || [])
      .map((member) => ({
        image: withBasePath(member.photo),
        url: member.linkedin,
        name: member.name,
        title: member.role || role.role || role.label,
        shortBio: member.shortBio,
        body: member.bio || "",
        slugline: role.slugline || role.microcopy || role.label || role.role,
        microcopy: role.microcopy || role.slugline || role.label || role.role,
        accentColor: member.accentColor || roleColor,
        trailColor: role.trailColor || roleColor,
        pathVariant:
          member.pathVariant || role.pathVariant || "underline-swoop",
        music: member.music || roleMusic,
        order: Number.isFinite(member.order) ? member.order : 0,
        roleSlug: role.slug || slug,
        photoFocus: member.photoFocus || "50% 50%",
        photoWidth: member.photoWidth,
        photoHeight: member.photoHeight,
      }))
      .sort((a, b) => a.order - b.order);

    membersByRole.set(slug, members);
  });

  const rows = (manifest.rows || []).map((row) =>
    row.flatMap((roleSlug) => membersByRole.get(roleSlug) || []),
  );

  return rows.filter((row) => row.length > 0);
}

let TABS = [];
let SECTION_INDEX = {};
let ABOUT_SECTION_INDEX = 0;
const RUBRIC_IMAGE_PATH = `${ASSET_BASE}Assets/images/rubric.png`;
const ABOUT_IMAGE_Y_OFFSET = -5;
const ABOUT_IMAGE_HEIGHT = 5.2;
let JOIN_LINK = "";
let JOIN_LABEL = "";
const NUAXION_LOGO_PATH = `${ASSET_BASE}Assets/images/nuaxion_logo.avif`;
let SPONSOR_SECTION_INDEX = 0;
const SPONSOR_IMAGE_Y_OFFSET = -5;
const SPONSOR_IMAGE_HEIGHT = 4.2;

let COMMITTEE_SECTION_INDEX = 0;
const COMMITTEE_BASE_POSITION = { x: 0, y: 4, z: -25 };
const COMMITTEE_IMAGE_HEIGHT = 5.6;
const COMMITTEE_IMAGE_SPACING = 11.4;
const COMMITTEE_ROW_SPACING = 8.9;
const COMMITTEE_CAPTION_GAP = 0.5;
const COMMITTEE_CAPTION_FONT_SIZE = 0.85;
let COMMITTEE_ROWS = [];

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

// light offsets relative to model center (camera views from +Z)
const KEY_LIGHT_OFFSET = { x: 2, y: 10, z: 40 };
const FILL_LIGHT_OFFSET = { x: -12, y: 4, z: 25 };
const RAINBOW_Z_OFFSET = -80; // behind model (home model z -20 → light z -100)
const RAINBOW_FADE_DURATION = 0.6;
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
const joinWord = document.querySelector(".bee-trail__join-word");
const joinEyePupils = document.querySelectorAll(".bee-trail--join .bee-trail__eye-pupil");
const socialAccessibleLinks = document.querySelector("#social-accessible-links");
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
document.body.dataset.joinState = joinUsStates.idleCurious;

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

const loader = new GLTFLoader();
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
let joinStateTimer = 0;
let joinBlushTimer = 0;
let joinNavigationTimer = 0;
let joinWinkTimer = 0;
let joinWinkCount = 0;
let committeeMembers = [];
let hoveredCommitteeImage = null;
let cachedViewportLayout = null;
let hoveredSocialCube = null;
let socialHoverKey = "";
let audioContext = null;
let activeSound = null;
let audioUnlocked = false;
let logoFallbackTexture = null;
let clothTexture = null;

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
let lastPointerClientX = Number.NEGATIVE_INFINITY;
let lastPointerClientY = Number.NEGATIVE_INFINITY;
let pointerIsDown = false;
let pointerPressure = 0;
let lastPointerType = "mouse";
let parallaxActive = false;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const coarsePointer = window.matchMedia("(pointer: coarse)");
let animationFrame = 0;
let resizeObserver = null;
let scrollObserver = null;

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

function createLogoFallbackTexture() {
  if (logoFallbackTexture) return logoFallbackTexture;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#10131b";
  ctx.fillRect(0, 0, size, size);

  const stroke = size * 0.14;
  const center = size * 0.5;
  const ringRadius = size * 0.22;

  ctx.strokeStyle = "#f6f2ea";
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    center,
    center + size * 0.02,
    ringRadius,
    Math.PI * 0.07,
    Math.PI * 0.93,
  );
  ctx.stroke();

  ctx.fillStyle = "#f6f2ea";
  ctx.fillRect(center - stroke * 0.33, size * 0.17, stroke * 0.66, size * 0.26);

  ctx.fillStyle = "#10131b";
  ctx.fillRect(size * 0.17, size * 0.69, size * 0.66, size * 0.16);
  ctx.fillRect(size * 0.12, size * 0.76, size * 0.76, size * 0.08);

  logoFallbackTexture = new THREE.CanvasTexture(canvas);
  logoFallbackTexture.colorSpace = THREE.SRGBColorSpace;
  logoFallbackTexture.flipY = false;
  logoFallbackTexture.minFilter = THREE.LinearMipmapLinearFilter;
  logoFallbackTexture.magFilter = THREE.LinearFilter;
  logoFallbackTexture.generateMipmaps = true;
  logoFallbackTexture.needsUpdate = true;
  return logoFallbackTexture;
}

function bakeLogoTexture(sourceTexture) {
  if (!sourceTexture) return sourceTexture;

  const image = sourceTexture.image;

  if (image?.width && image?.height) {
    const size = Math.max(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#10131b";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size, size);
    ctx.fillStyle = "#10131b";
    ctx.fillRect(size * 0.14, size * 0.68, size * 0.72, size * 0.18);

    const bakedTexture = new THREE.CanvasTexture(canvas);
    bakedTexture.colorSpace = THREE.SRGBColorSpace;
    bakedTexture.flipY = false;
    bakedTexture.minFilter = THREE.LinearMipmapLinearFilter;
    bakedTexture.magFilter = THREE.LinearFilter;
    bakedTexture.generateMipmaps = true;
    bakedTexture.needsUpdate = true;
    return bakedTexture;
  }

  sourceTexture.colorSpace = THREE.SRGBColorSpace;
  sourceTexture.flipY = false;
  sourceTexture.minFilter = THREE.LinearMipmapLinearFilter;
  sourceTexture.magFilter = THREE.LinearFilter;
  sourceTexture.generateMipmaps = true;
  sourceTexture.needsUpdate = true;
  return sourceTexture;
}

function hashString(value = "") {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function primeAudioContext(context) {
  try {
    const buffer = context.createBuffer(1, 1, context.sampleRate || 44100);
    const source = context.createBufferSource();
    const gain = context.createGain();

    gain.gain.value = 0;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
    };
    source.start();
    source.stop(context.currentTime + 0.01);
  } catch {}
}

function unlockAudio() {
  if (audioUnlocked) return;

  try {
    const context = ensureAudioContext();
    audioUnlocked = true;
    pointerDirty = true;
    updateSocialCubeHover();
    updateAboutJoinHover();
    updateCommitteeHover();
    const resumePromise =
      context.state === "suspended" ? context.resume() : Promise.resolve();
    resumePromise
      .then(() => {
        primeAudioContext(context);
        playCurrentHoverAudio();
      })
      .catch(() => {
        primeAudioContext(context);
        playCurrentHoverAudio();
      });
  } catch {}
}

function playCurrentHoverAudio() {
  if (hoveredSocialCube?.visible) {
    playMusicCue(
      hoveredSocialCube.userData.music,
      socialHoverKey ||
        `social:${hoveredSocialCube.userData.socialIndex}:${hoveredSocialCube.userData.url}`,
    );
    return;
  }

  if (hoveredCommitteeImage?.visible) {
    playMusicCue(
      hoveredCommitteeImage.userData.music,
      `committee:${hoveredCommitteeImage.userData.memberIndex}`,
    );
  }
}

function stopActiveSound(immediate = false) {
  if (!activeSound) return;

  const { gain, nodes, cleanupTimer } = activeSound;
  window.clearTimeout(cleanupTimer);

  if (immediate) {
    try {
      gain.gain.cancelScheduledValues(audioContext?.currentTime || 0);
      gain.gain.value = 0;
    } catch {}
    nodes.forEach((node) => {
      try {
        node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    });
    try {
      gain.disconnect();
    } catch {}
    activeSound = null;
    return;
  }

  const context = audioContext;
  const now = context?.currentTime || 0;

  try {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value || 0.0001, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.09);
  } catch {}

  activeSound.cleanupTimer = window.setTimeout(() => {
    nodes.forEach((node) => {
      try {
        node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    });
    try {
      gain.disconnect();
    } catch {}
    activeSound = null;
  }, 120);
}

function playMusicCue(music, key = "") {
  if (!music) return;
  if (!audioUnlocked) return;

  const context = ensureAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context
      .resume()
      .then(() => {
        primeAudioContext(context);
        if (context.state === "running") {
          playMusicCue(music, key);
        }
      })
      .catch(() => {});
    return;
  }

  if (activeSound?.key === key) return;
  stopActiveSound(false);

  const seed = hashString(`${music.label || ""}|${music.url || ""}|${key}`);
  const baseFrequency = 164 + (seed % 6) * 18;
  const scale = music.source === "youtube" ? [0, 5, 7, 12] : [0, 3, 7, 10];
  const noteCount = Math.max(3, Math.min(4, scale.length));
  const noteLength = Math.max(
    0.08,
    ((music.duration || 2.4) / (noteCount + 1)) * 0.5,
  );
  const gap = Math.max(0.06, noteLength * 0.75);
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const nodes = [];
  const now = context.currentTime + 0.01;

  filter.type = music.source === "youtube" ? "lowpass" : "bandpass";
  filter.frequency.setValueAtTime(1200 + (seed % 5) * 220, now);
  filter.Q.setValueAtTime(0.8 + (seed % 3) * 0.18, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(
    clamp01(Math.min(0.46, (music.volume || 0.3) + 0.12)),
    now + 0.04,
  );
  gain.connect(filter);
  filter.connect(context.destination);

  const timbre =
    music.source === "youtube"
      ? "square"
      : seed % 2 === 0
        ? "sawtooth"
        : "triangle";

  for (let i = 0; i < noteCount; i += 1) {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    const octave = i === noteCount - 1 ? 12 : 0;
    const note = scale[i % scale.length] + octave;
    const frequency = baseFrequency * 2 ** (note / 12);
    const startAt = now + i * gap;
    const stopAt = startAt + noteLength;

    oscillator.type = timbre;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.detune.setValueAtTime(((seed >> (i * 3)) % 9) - 4, startAt);
    noteGain.gain.setValueAtTime(0.0001, startAt);
    noteGain.gain.linearRampToValueAtTime(1, startAt + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    oscillator.connect(noteGain);
    noteGain.connect(gain);
    oscillator.start(startAt);
    oscillator.stop(stopAt + 0.04);
    nodes.push(oscillator, noteGain);
  }

  activeSound = {
    key,
    gain,
    nodes,
    cleanupTimer: 0,
  };
}

function setupAudioUnlock() {
  const unlockEvents = ["pointerdown", "touchstart", "keydown", "click"];
  unlockEvents.forEach((eventName) => {
    window.addEventListener(eventName, unlockAudio, { capture: true });
  });
}

function isCompactViewport() {
  return viewportWidth <= COMPACT_VIEWPORT_WIDTH || viewportHeight <= 480;
}

function isShortViewport() {
  return viewportHeight <= SHORT_VIEWPORT_HEIGHT;
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

  pointerCurrent.lerp(
    pointerTarget,
    reduced ? REDUCED_POINTER_DAMPING : POINTER_DAMPING,
  );

  if (!modelGroup || isAnimating) return;

  const layout = getViewportLayout();
  const sectionPos = getCameraAnchorPos();
  const parallaxX = reduced
    ? 0
    : pointerCurrent.x * (layout.compact ? 0.24 : 0.48);
  const parallaxY = reduced
    ? 0
    : pointerCurrent.y * (layout.compact ? 0.18 : 0.3);

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

  const tiltX = reduced ? 0 : -pointerCurrent.y * 0.095;
  const tiltY = reduced ? 0 : pointerCurrent.x * 0.14;

  for (const cube of socialCubes) {
    if (cube.visible) {
      cube.rotation.x = tiltX;
      cube.rotation.y = tiltY;
    }
  }

  for (const member of committeeMembers) {
    if (member.image.visible) {
      const profile = getCommitteeHoverProfile(member.roleSlug);
      const hoverBoost = member.image === hoveredCommitteeImage ? 1.35 : 1;
      const bob = member.image === hoveredCommitteeImage ? profile.bob : 0;
      const baseX = member.image.userData.baseX ?? member.image.position.x;
      const baseY = member.image.userData.baseY ?? member.image.position.y;
      const driftX = reduced
        ? 0
        : pointerCurrent.x * profile.driftX * 0.28 * hoverBoost;
      const driftY = reduced
        ? 0
        : pointerCurrent.y * profile.driftY * 0.18 * hoverBoost;
      member.image.rotation.set(
        tiltX * (0.65 + profile.driftY * hoverBoost) +
          (member.image === hoveredCommitteeImage ? profile.rotate : 0),
        tiltY * (0.65 + profile.driftX * hoverBoost),
        0,
      );
      member.image.position.x = baseX + driftX;
      if (member.image === hoveredCommitteeImage) {
        member.image.position.z = COMMITTEE_BASE_POSITION.z + profile.z;
        member.image.position.y =
          baseY + driftY + bob * Math.sin(performance.now() * 0.004);
      } else {
        member.image.position.y = baseY + driftY;
      }
      if (member.caption.visible) {
        member.caption.position.x = member.image.position.x;
      }
    }
  }

  for (const mesh of [aboutJoinImage]) {
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
    cameraScale: narrow
      ? 1.18
      : compact
        ? 1.12
        : short
          ? 1.03
          : wide
            ? 0.82
            : 0.94,
    cameraYOffset: narrow ? 0.7 : compact ? 0.4 : 0,
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
      ? 0.98
      : compact
        ? 1.04
        : short
          ? 1
          : DESCRIPTION_FONT_SIZE,
    textMaxWidth: narrow ? 12 : compact ? 18 : tablet ? 30 : wide ? 34 : 36,
    sponsorImageHeight: compact ? 3.5 : SPONSOR_IMAGE_HEIGHT,
    sponsorImageY: compact
      ? -0.8
      : SPONSOR_IMAGE_POS.y + SPONSOR_IMAGE_Y_OFFSET,
    aboutImageHeight: narrow ? 3.2 : compact ? 3.65 : ABOUT_IMAGE_HEIGHT,
    aboutImageY: narrow
      ? -2.15
      : compact
        ? -2.35
        : ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    socialCubeSpacing: narrow
      ? 2.7
      : compact
        ? 3.2
        : SOCIAL_CUBES.length > 4
          ? 4.35
          : SOCIAL_CUBE_SPACING,
    socialCubeY: compact ? -0.15 : SOCIAL_CUBE_BASE.y,
    socialCardWidth: narrow ? 2.75 : compact ? 3.05 : 3.25,
    socialCardHeight: narrow ? 2.75 : compact ? 3.05 : 3.25,
    committeeImageHeight: narrow
      ? 3
      : compact
        ? 3.35
        : tablet
          ? 4.8
          : wide
            ? 6.3
            : COMMITTEE_IMAGE_HEIGHT,
    committeeImageSpacing: narrow
      ? 4.15
      : compact
        ? 5.1
        : tablet
          ? 8.1
          : wide
            ? 12.9
            : COMMITTEE_IMAGE_SPACING,
    committeeRowSpacing: narrow
      ? 4.7
      : compact
        ? 5
        : tablet
          ? 6.9
          : wide
            ? 9.8
            : COMMITTEE_ROW_SPACING,
    committeeCaptionFontSize: narrow
      ? 0.65
      : compact
        ? 0.7
        : COMMITTEE_CAPTION_FONT_SIZE,
    committeeBaseY: narrow ? 4.1 : compact ? 3.55 : COMMITTEE_BASE_POSITION.y,
    committeeMobileRows: narrow ? [1, 2, 4] : compact ? [1, 2, 4] : null,
  };

  if (landscape) {
    cachedViewportLayout.titleFontSize = 1.08;
    cachedViewportLayout.descriptionFontSize = 0.78;
    cachedViewportLayout.textMaxWidth = 16;
    cachedViewportLayout.aboutImageHeight = 3.8;
    cachedViewportLayout.sponsorImageHeight = 3;
    cachedViewportLayout.socialCardWidth = 3;
    cachedViewportLayout.socialCardHeight = 3;
    cachedViewportLayout.committeeImageHeight = 3.7;
    cachedViewportLayout.committeeImageSpacing = 5.35;
    cachedViewportLayout.committeeRowSpacing = 4.8;
    cachedViewportLayout.committeeCaptionFontSize = 0.62;
    cachedViewportLayout.committeeMobileRows = [1, 2, 4];
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

function applyModelTransform() {
  if (!modelGroup) return;

  const pos = getCurrentSectionPos();
  modelGroup.position.set(pos.x, pos.y, pos.z);
  modelGroup.rotation.set(
    THREE.MathUtils.degToRad(MODEL_ROTATION.x),
    THREE.MathUtils.degToRad(MODEL_ROTATION.y),
    THREE.MathUtils.degToRad(MODEL_ROTATION.z),
  );
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
  return polishTexture(textureLoader.load(texture));
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

  if (kind === "mail" || kind === "grass") {
    return {
      base: 0x385629,
      top: 0x4f7837,
      bottom: 0x25381b,
      back: 0x304925,
      roughness: 0.99,
      metalness: 0.01,
      clearcoat: 0.02,
      clearcoatRoughness: 0.96,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xd8efb0),
      sheenRoughness: 0.84,
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
    config.kind === "mail" || config.kind === "grass"
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
    kind === "rubber" ? -0.1 : kind === "mail" || kind === "grass" ? -0.045 : -0.07;
  material.envMapIntensity = kind === "glass" ? 1.4 : 0.9;
  material.needsUpdate = true;

  if (kind === "glass") {
    material.transparent = true;
    material.opacity = 0.86;
  } else if (kind === "mail" || kind === "grass") {
    material.transparent = true;
    material.opacity = 0.18;
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

const grassBladeDummy = new THREE.Object3D();

function createGrassLogoBlades(touchField, layout) {
  const kind = touchField.config.kind;
  if (kind !== "grass") return null;

  const logoWidth = layout.socialCardWidth;
  const logoHeight = layout.socialCardHeight;
  const logoSize = Math.min(logoWidth, logoHeight);
  const targetBladeCount = layout.narrow ? 360 : 640;
  const blades = [];

  const random = (seed) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };
  const isGrassLogoBlade = (x, y) => {
    const nx = x / (logoWidth * 0.42);
    const ny = y / (logoHeight * 0.42);
    const square =
      Math.abs(nx) < 0.72 &&
      Math.abs(ny) < 0.72 &&
      (Math.abs(Math.abs(nx) - 0.72) < 0.08 ||
        Math.abs(Math.abs(ny) - 0.72) < 0.08);
    const lens = Math.abs(Math.hypot(nx, ny) - 0.34) < 0.08;
    const dot = Math.hypot(nx - 0.43, ny + 0.43) < 0.09;
    return square || lens || dot;
  };

  for (let i = 0; blades.length < targetBladeCount && i < targetBladeCount * 90; i += 1) {
    const x = (random(i + 1) - 0.5) * logoWidth;
    const y = (random(i + 101) - 0.5) * logoHeight;
    if (!isGrassLogoBlade(x, y)) continue;

    blades.push({
      x,
      y,
      uvx: 0.5 + x / logoWidth,
      uvy: 0.5 + y / logoHeight,
      height: logoSize * (0.06 + random(i + 17) * 0.055),
      angle: (random(i + 29) - 0.5) * 0.28,
      stiffness: 0.55 + random(i + 41) * 0.38,
      highlight: random(i + 53) > 0.72,
    });
  }

  if (blades.length === 0) return null;

  const geometry = new THREE.PlaneGeometry(0.035, 0.18, 1, 2);
  geometry.translate(0, 0.09, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x73c447,
    roughness: 0.86,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.25,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, blades.length);

  blades.forEach((blade, index) => {
    const color = new THREE.Color(
      blade.highlight ? 0xc6f46b : index % 2 === 0 ? 0x72c543 : 0x4d982f,
    );
    mesh.setColorAt(index, color);
  });

  mesh.instanceColor.needsUpdate = true;
  mesh.position.set(0, 0, SOCIAL_CARD_DEPTH / 2 + 0.08);
  mesh.userData.blades = blades;
  mesh.userData.touchField = touchField;
  mesh.userData.isSocialGrass = true;
  mesh.renderOrder = 45;
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

  const pos = modelGroup.position;
  rainbowBackdrop.position.set(
    pos.x,
    pos.y + modelLookHeight,
    pos.z + RAINBOW_Z_OFFSET,
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
  document.body.dataset.contentVariant = tab?.pathVariant || "underline-swoop";
  document.body.style.setProperty(
    "--content-accent",
    tab?.accentColor || "#FF5757",
  );
  document.body.style.setProperty(
    "--content-trail",
    tab?.trailColor || tab?.accentColor || "#FF5757",
  );
  document.body.removeAttribute("data-trails-ready");

  if (currentIndex !== COMMITTEE_SECTION_INDEX) {
    closeMemberPopup();
  }
}

function restartChalkTrailMotion(selector = ".bee-trail") {
  document.body.dataset.trailsReady = "true";
  if (prefersReducedMotion.matches) return;

  window.requestAnimationFrame(() => {
    document.querySelectorAll(selector).forEach((node) => {
      const trail = node.closest?.(".bee-trail") || node;
      trail.style.animation = "none";
      trail.getBoundingClientRect();
      trail.style.animation = "";
      trail
        .querySelectorAll("animateMotion")
        .forEach((animation) => animation.beginElement?.());
    });
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

  memberPopupImage.src = member.image;
  memberPopupImage.srcset = member.photoWidth
    ? `${member.image} ${member.photoWidth}w`
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
  memberPopupCard.dataset.microcopy =
    member.slugline || member.microcopy || member.title;
  document.body.dataset.popupOpen = "true";
  currentPopupAnchorObject = originObject;
  memberPopup.classList.remove("is-open");
  memberPopup.hidden = false;
  positionMemberPopup(origin);
  playMusicCue(member.music, `committee:${member.memberIndex}`);

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
  stopActiveSound(false);
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

let navCondenseTimer = 0;

function setNavbarCondensed(condensed) {
  if (!navbar) return;

  navbar.classList.toggle("is-condensed", condensed);
}

function scheduleNavbarCondense(delay = 1200) {
  if (coarsePointer.matches) return;

  window.clearTimeout(navCondenseTimer);
  navCondenseTimer = window.setTimeout(() => {
    if (
      !navbar?.matches(":hover") &&
      !navbar?.contains(document.activeElement)
    ) {
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
  const promises = [revealSectionText(index), revealSectionDescription(index)];

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
  const promises = [hideSectionText(index), hideSectionDescription(index)];

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
    }),
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
      getResponsiveSection(TEXT_SECTIONS[index], index, COMPACT_TEXT_LAYOUTS),
    );
  });

  sectionDescriptionTexts.forEach((textMesh, index) => {
    textMesh.fontSize = layout.descriptionFontSize;
    applyTextMeshLayout(
      textMesh,
      getResponsiveSection(
        DESCRIPTION_SECTIONS[index],
        index,
        COMPACT_DESCRIPTION_LAYOUTS,
      ),
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
  if (!aboutJoinImage) return;

  const layout = getViewportLayout();
  aboutJoinImage.position.set(
    ABOUT_IMAGE_POS.x,
    layout.aboutImageY,
    ABOUT_IMAGE_POS.z,
  );
  aboutJoinImage.userData.baseX = ABOUT_IMAGE_POS.x;
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
    sponsorDescription.z,
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
  material.depthTest = false;
  material.depthWrite = false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  mesh.position.set(
    ABOUT_IMAGE_POS.x,
    ABOUT_IMAGE_POS.y + ABOUT_IMAGE_Y_OFFSET,
    ABOUT_IMAGE_POS.z,
  );
  mesh.renderOrder = 100;
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

function setJoinState(state) {
  if (document.body.dataset.joinState === state) return;

  document.body.dataset.joinState = state;
}

function clearJoinTimers() {
  window.clearTimeout(joinStateTimer);
  window.clearTimeout(joinBlushTimer);
}

function stopJoinWink() {
  window.clearTimeout(joinWinkTimer);
  document.body.removeAttribute("data-join-wink");
}

function scheduleJoinWink() {
  window.clearTimeout(joinWinkTimer);
  joinWinkTimer = window.setTimeout(
    () => {
      if (document.body.dataset.joinState === joinUsStates.idleCurious) {
        document.body.dataset.joinWink = "true";
        window.setTimeout(() => {
          document.body.removeAttribute("data-join-wink");
        }, prefersReducedMotion.matches ? 1 : 150);
      }
      joinWinkCount += 1;
      scheduleJoinWink();
    },
    prefersReducedMotion.matches
      ? 9000
      : getOrganicWinkDelayMs(hashString(JOIN_LABEL || "JOIN US"), joinWinkCount),
  );
}

function updateJoinEyes() {
  if (!joinWord || joinEyePupils.length === 0) return;
  if (
    document.body.dataset.joinState === joinUsStates.joinNear ||
    document.body.dataset.joinState === joinUsStates.sadShrivel
  ) {
    joinEyePupils.forEach((pupil) => pupil.removeAttribute("transform"));
    return;
  }

  const rect = joinWord.getBoundingClientRect();
  if (!rect.width || !Number.isFinite(lastPointerClientX)) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const offset = constrainPupilOffset(
    (lastPointerClientX - centerX) * 0.035,
    (lastPointerClientY - centerY) * 0.035,
    { width: 11, height: 10 },
  );

  joinEyePupils.forEach((pupil, index) => {
    const sideBias = index === 0 ? -0.25 : 0.25;
    pupil.setAttribute(
      "transform",
      `translate(${(offset.x + sideBias).toFixed(2)} ${offset.y.toFixed(2)})`,
    );
  });
}

function updateJoinCuriosityState() {
  const state = document.body.dataset.joinState || joinUsStates.idleCurious;
  updateJoinEyes();

  if (
    currentIndex !== ABOUT_SECTION_INDEX ||
    isAnimating ||
    !aboutJoinImage?.visible ||
    state === joinUsStates.rubricsHoverExcited ||
    state === joinUsStates.rubricsHoverBlush ||
    state === joinUsStates.rubricsClickCelebration ||
    state === joinUsStates.sadShrivel ||
    state === joinUsStates.recoveringToIdle
  ) {
    return;
  }

  const rect = joinWord?.getBoundingClientRect();
  if (!rect?.width || !Number.isFinite(lastPointerClientX)) {
    setJoinState(joinUsStates.idleCurious);
    return;
  }

  const nearPad = Math.max(72, Math.min(128, viewportWidth * 0.08));
  const nearJoin =
    lastPointerClientX >= rect.left - nearPad &&
    lastPointerClientX <= rect.right + nearPad &&
    lastPointerClientY >= rect.top - nearPad &&
    lastPointerClientY <= rect.bottom + nearPad;

  setJoinState(nearJoin ? joinUsStates.joinNear : joinUsStates.idleCurious);
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

  clearJoinTimers();
  setJoinState(joinUsStates.idleCurious);
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
    clearJoinTimers();
    document.body.dataset.contentHover = "join";
    setJoinState(joinUsStates.rubricsHoverExcited);
    startRubricsDance();
    joinBlushTimer = window.setTimeout(
      () => setJoinState(joinUsStates.rubricsHoverBlush),
      prefersReducedMotion.matches ? 800 : JOIN_US_BLUSH_DELAY_MS,
    );
    gsap.to(aboutJoinImage.scale, {
      x: 1.035,
      y: 1.035,
      z: 1.035,
      duration: motionDuration(0.12),
      ease: "back.out(2)",
    });
    gsap.to(aboutJoinImage.position, {
      y: baseY,
      duration: motionDuration(0.12),
      ease: "power2.out",
    });
  } else {
    document.body.removeAttribute("data-content-hover");
    clearJoinTimers();
    stopRubricsDance();
    setJoinState(joinUsStates.sadShrivel);
    restartChalkTrailMotion(".bee-trail--join");
    joinStateTimer = window.setTimeout(
      () => {
        setJoinState(joinUsStates.recoveringToIdle);
        joinStateTimer = window.setTimeout(
          () => {
            setJoinState(joinUsStates.idleCurious);
          },
          prefersReducedMotion.matches ? 100 : 180,
        );
      },
      prefersReducedMotion.matches ? 320 : 760,
    );
    aboutJoinImage.userData.tiltZ = 0;
    gsap.to(aboutJoinImage.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: motionDuration(0.12),
      ease: "power2.out",
    });
    gsap.to(aboutJoinImage.position, {
      y: baseY,
      duration: motionDuration(0.12),
      ease: "power2.out",
    });
  }
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
  if (!url || aboutJoinImage?.userData.navigating) return;

  if (aboutJoinImage) aboutJoinImage.userData.navigating = true;
  clearJoinTimers();
  window.clearTimeout(joinNavigationTimer);
  stopRubricsDance();
  setJoinState(joinUsStates.rubricsClickCelebration);
  document.body.dataset.contentHover = "join";

  joinNavigationTimer = window.setTimeout(
    () => {
      if (aboutJoinImage) aboutJoinImage.userData.navigating = false;
      navigateJoinTarget(url);
    },
    prefersReducedMotion.matches ? 220 : JOIN_US_NAVIGATION_DELAY_MS,
  );
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
      celebrateAndNavigateJoin(aboutJoinImage.userData.url);
    }
  });
}

function triggerJoinHoverFromKeyboard(active) {
  if (active) {
    clearJoinTimers();
    document.body.dataset.contentHover = "join";
    setJoinState(joinUsStates.rubricsHoverExcited);
    joinBlushTimer = window.setTimeout(
      () => setJoinState(joinUsStates.rubricsHoverBlush),
      prefersReducedMotion.matches ? 800 : JOIN_US_BLUSH_DELAY_MS,
    );
    startRubricsDance();
    return;
  }

  document.body.removeAttribute("data-content-hover");
  clearJoinTimers();
  stopRubricsDance();
  setJoinState(joinUsStates.sadShrivel);
  joinStateTimer = window.setTimeout(
    () => {
      setJoinState(joinUsStates.recoveringToIdle);
      joinStateTimer = window.setTimeout(
        () => setJoinState(joinUsStates.idleCurious),
        prefersReducedMotion.matches ? 100 : 180,
      );
    },
    prefersReducedMotion.matches ? 320 : 760,
  );
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
    if (event.key !== " ") return;
    event.preventDefault();
    celebrateAndNavigateJoin(joinUsAccessibleLink.href || JOIN_LINK);
  });
}

function getCommitteeMemberPosition(
  rowIndex,
  colIndex,
  rowLength,
  memberIndex = 0,
) {
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
    position.z,
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
        memberIndex,
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
      image.userData.music = config.music || null;
      image.userData.memberIndex = memberIndex;
      image.userData.texturePath = config.image;
      image.userData.layout = {
        rowIndex,
        colIndex,
        rowLength: row.length,
        memberIndex,
      };
      image.userData.baseY = position.y;
      image.userData.fadeTween = null;
      image.visible = false;
      scene.add(image);

      const caption = createCommitteeCaption(
        config.title,
        position,
        getViewportLayout().committeeImageHeight,
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
        roleSlug: config.roleSlug,
        sourceImage: config.image,
        photoFocus: config.photoFocus,
        photoWidth: config.photoWidth,
        photoHeight: config.photoHeight,
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
      member.memberIndex,
    );

    member.image.position.set(position.x, position.y, position.z);
    member.image.userData.baseX = position.x;
    member.image.userData.baseY = position.y;
    resizeAvatarPlane(member.image, layout.committeeImageHeight);

    member.caption.fontSize = layout.committeeCaptionFontSize;
    member.caption.position.set(
      position.x,
      position.y - layout.committeeImageHeight / 2 - COMMITTEE_CAPTION_GAP,
      position.z,
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
    }),
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
    }),
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
    gsap.killTweensOf(hoveredCommitteeImage.position, "x");
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
      x:
        hoveredCommitteeImage.userData.baseX ??
        hoveredCommitteeImage.position.x,
      duration: motionDuration(0.16),
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
    gsap.killTweensOf(hoveredCommitteeImage.position, "z");
    gsap.killTweensOf(hoveredCommitteeImage.position, "x");
    gsap.killTweensOf(hoveredCommitteeImage.position, "y");
    gsap.killTweensOf(hoveredCommitteeImage.scale);
    gsap.to(hoveredCommitteeImage.scale, {
      x: profile.scale,
      y: profile.scale,
      z: profile.scale,
      duration: motionDuration(0.18),
      ease: "power2.out",
    });
    gsap.to(hoveredCommitteeImage.position, {
      z: COMMITTEE_BASE_POSITION.z + profile.z,
      x:
        (hoveredCommitteeImage.userData.baseX ??
          hoveredCommitteeImage.position.x) +
        profile.driftX * 2.6,
      y:
        (hoveredCommitteeImage.userData.baseY ??
          hoveredCommitteeImage.position.y) +
        profile.bob * 0.2,
      duration: motionDuration(0.18),
      ease: "power2.out",
    });
    playMusicCue(
      hoveredCommitteeImage.userData.music,
      `committee:${hoveredCommitteeImage.userData.memberIndex}`,
    );
  } else {
    stopActiveSound(false);
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
      playMusicCue(
        intersects[0].object.userData.music,
        `committee:${intersects[0].object.userData.memberIndex}`,
      );
      openMemberPopup(
        intersects[0].object.userData.memberIndex,
        intersects[0].object,
      );
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
        }),
    ),
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

  if (card.userData.grassLogo) {
    card.remove(card.userData.grassLogo);
    card.userData.grassLogo.geometry.dispose();
    card.userData.grassLogo.material.dispose();
    card.userData.grassLogo = createGrassLogoBlades(
      card.userData.touchField,
      layout,
    );
    if (card.userData.grassLogo) card.add(card.userData.grassLogo);
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
  caption.position.set(
    0,
    -layout.socialCardHeight / 2 - 0.42,
    SOCIAL_CARD_DEPTH / 2 + 0.04,
  );
  caption.raycast = () => {};
  caption.sync();

  return caption;
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
    const grassLogo = createGrassLogoBlades(touchField, layout);
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
    cube.userData.grassLogo = grassLogo;
    cube.userData.underline = underline;
    cube.userData.baseX = cube.position.x;
    cube.userData.baseY = cube.position.y;
    cube.userData.hovered = false;
    cube.userData.music = config.music || null;
    cube.userData.floatTween = null;
    cube.userData.growTween = null;
    cube.userData.entranceTween = null;
    cube.userData.exitTween = null;
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
    if (grassLogo) cube.add(grassLogo);
    cube.add(underline);
    cube.add(caption);
    scene.add(cube);
    return cube;
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
        hasGrassLogo: Boolean(cube.userData.grassLogo),
        pressure: cube.userData.touchField?.poke?.pressure || 0,
        screenX: canvasRect.left + (point.x * 0.5 + 0.5) * canvasRect.width,
        screenY: canvasRect.top + (-point.y * 0.5 + 0.5) * canvasRect.height,
      };
    });
  };
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
    SOCIAL_CUBE_BASE.z,
  );
  cube.rotation.set(0, 0, 0);
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
      SOCIAL_CUBE_SCALE_MIN,
    );
  });
  stopActiveSound(true);
}

function hideSocialCubes() {
  canvas.style.cursor = "default";
  document.body.removeAttribute("data-content-hover");
  document.body.removeAttribute("data-material-type");
  document.body.removeAttribute("data-pointer-active");
  document.body.removeAttribute("data-interaction-state");
  hoveredSocialCube = null;
  socialHoverKey = "";
  stopActiveSound(false);

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
        SOCIAL_CUBE_SCALE_MIN,
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
    document.body.removeAttribute("data-material-type");
    document.body.removeAttribute("data-pointer-active");
    document.body.removeAttribute("data-interaction-state");
  }
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
  if (hit.object !== cube && !hit.object.userData?.isSocialGrass) return null;

  const local = cube.worldToLocal(hit.point.clone());
  const width = cube.userData.width || 1;
  const height = cube.userData.height || 1;
  return new THREE.Vector2(
    THREE.MathUtils.clamp(local.x / width + 0.5, 0, 1),
    THREE.MathUtils.clamp(local.y / height + 0.5, 0, 1),
  );
}

function updateGrassLogoBlades(mesh) {
  if (!mesh?.userData?.blades || !mesh.parent?.visible) return;

  const field = mesh.userData.touchField;
  const poke = field?.poke;
  const velocity = poke ? getPokeVelocity(poke) : { x: 0, y: 0, length: 0 };
  const time = performance.now() * 0.002;

  mesh.userData.blades.forEach((blade, index) => {
    const influence = poke
      ? getPokeInfluence(poke, blade.uvx, blade.uvy, 0.22)
      : 0;
    const comb = influence * (0.22 + velocity.length * 1.4);
    const dx = blade.uvx - (poke?.x ?? 0.5);
    const dy = blade.uvy - (poke?.y ?? 0.5);
    const wind = Math.sin(time + index * 0.37) * 0.025;

    grassBladeDummy.position.set(
      blade.x + dx * comb * 0.48,
      blade.y + dy * comb * 0.32,
      influence * -0.055,
    );
    grassBladeDummy.rotation.set(
      influence * (0.85 + blade.stiffness) + wind,
      0,
      blade.angle + dx * influence * 1.8,
    );
    grassBladeDummy.scale.set(
      1,
      (blade.height / 0.18) * Math.max(0.28, 1 - influence * 0.68),
      1,
    );
    grassBladeDummy.updateMatrix();
    mesh.setMatrixAt(index, grassBladeDummy.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
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
    updateGrassLogoBlades(cube.userData.grassLogo);

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
  const intersects = raycaster.intersectObjects(visibleCubes, true);
  const hoveredHit = intersects[0] ?? null;
  const hoveredCube = hoveredHit
    ? getSocialCubeFromObject(hoveredHit.object)
    : null;
  let pointerActive = false;
  const hoveredKey = hoveredCube
    ? `social:${hoveredCube.userData.socialIndex}:${hoveredCube.userData.url}`
    : "";

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
        const touchUv = getSocialTouchUv(cube, hoveredHit);
        const pressure = pointerIsDown
          ? Math.max(pointerPressure, lastPointerType === "touch" ? 0.85 : 0.75)
          : Math.max(pointerPressure, 0.25);
        stampMaterialTouch(cube.userData.touchField, touchUv, hoveredHit.point, pressure);
        document.body.dataset.materialType = cube.userData.materialKind;
        document.body.dataset.pointerActive = "true";
        document.body.dataset.interactionState = pointerIsDown ? "pressed" : "hover";
      }
    } else if (cube.userData.hovered) {
      resetSocialCubeHover(cube);
    }
  });

  if (hoveredCube && hoveredKey !== socialHoverKey) {
    socialHoverKey = hoveredKey;
    hoveredSocialCube = hoveredCube;
    playMusicCue(hoveredCube.userData.music, hoveredKey);
  } else if (!hoveredCube && hoveredSocialCube) {
    hoveredSocialCube = null;
    socialHoverKey = "";
    stopActiveSound(false);
  }

  if (!pointerActive) {
    document.body.removeAttribute("data-content-hover");
    document.body.removeAttribute("data-material-type");
    document.body.removeAttribute("data-pointer-active");
    document.body.removeAttribute("data-interaction-state");
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

  socialCubes.forEach((cube) => {
    if (cube.userData.hovered) resetSocialCubeHover(cube);
  });
  hoveredSocialCube = null;
  socialHoverKey = "";
  stopActiveSound(false);
  document.body.removeAttribute("data-content-hover");
  document.body.removeAttribute("data-material-type");
  document.body.removeAttribute("data-pointer-active");
  document.body.removeAttribute("data-interaction-state");
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
      playMusicCue(
        cube.userData.music,
        `social:${cube.userData.socialIndex}:${url}`,
      );
      if (url.startsWith("mailto:")) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
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
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
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

function restoreLogoBoxMaterials(root, logoTexture) {
  const bakedTexture = bakeLogoTexture(logoTexture);
  polishTexture(bakedTexture);

  root.traverse((child) => {
    if (!child.isMesh) return;

    child.geometry.computeVertexNormals();

    if (child.name === "Body1") {
      child.material.map = bakedTexture;
      child.material.color.set(0xffffff);
      child.material.transparent = false;
      child.material.alphaTest = 0;
      child.material.roughness = 0.14;
      child.material.metalness = 0.18;
      child.material.clearcoat = 0.94;
      child.material.clearcoatRoughness = 0.04;
      child.material.envMapIntensity = 1.24;
      child.material.emissive.set(0x000000);
      child.material.emissiveIntensity = 0.02;
    } else {
      child.material.map = null;
      child.material.emissiveMap = null;
      child.material.roughness = 0.18;
      child.material.metalness = 0.58;
      child.material.clearcoat = 0.86;
      child.material.clearcoatRoughness = 0.08;
      child.material.envMapIntensity = 1.1;
      child.material.emissive.set(0x07090f);
      child.material.emissiveIntensity = 0.12;
    }

    child.material.needsUpdate = true;
  });
}

async function loadSceneModel() {
  try {
    const gltf = await loader.loadAsync(MODEL_PATH);
    let logoTexture;

    try {
      logoTexture = await textureLoader.loadAsync(LABS_LOGO_PATH);
    } catch (textureError) {
      console.warn("Logo texture fallback:", textureError);
      logoTexture = createLogoFallbackTexture();
    }

    modelGroup = new THREE.Group();

    restoreLogoBoxMaterials(gltf.scene, logoTexture);
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

    await warmupSectionTexts();
    setCameraOnModel(getSectionPos(0));
    animateModelEntrance(maxSize);
    aimLightsAtModel();
    updateStatus();
    logModelPosition("Model (loaded)");
  } catch (error) {
    console.error("Failed to load GLB:", error);
  }
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

  animateRainbowBackdrop();
  applyPointerMotion();
  updateJoinCuriosityState();
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
    stopActiveSound(true);
  } else {
    pointerDirty = true;
    startAnimationLoop();
  }
});

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;

  stopAnimationLoop();
  stopActiveSound(true);
  clearJoinTimers();
  window.clearTimeout(joinNavigationTimer);
  stopJoinWink();
  scrollObserver?.kill();
  resizeObserver?.disconnect();

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = 0;
  }
});

async function init() {
  await loadSiteContent();
  setupAccessibleContentLinks();
  COMMITTEE_ROWS = await loadCommitteeRows();
  setupScrollControl();
  setupKeyboardNavigation();
  setupAudioUnlock();
  initSectionTexts();
  sponsorImage = createSponsorImage();
  aboutJoinImage = createAboutJoinImage();
  committeeMembers = createCommitteeMembers();
  setupNavbar();
  setupMemberPopup();
  socialCubes = createSocialCubes();
  applyResponsiveLayout();
  exposeSocialMaterialTestState();
  setupJoinAccessibleInteraction();
  setupSocialCubeInteraction();
  setupAboutJoinInteraction();
  setupCommitteeInteraction();
  scheduleJoinWink();
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
