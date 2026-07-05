export const PATH_VARIANTS = [
  "steady-loop",
  "excited-loop",
  "loop-buzz",
  "route-hop",
  "ziggle-pop",
  "spiral-pop",
  "hop-hop",
  "underline-swoop",
] as const;

export type PathVariant = (typeof PATH_VARIANTS)[number];

export const MUSIC_SOURCES = [
  "youtube",
  "local",
  "provider",
  "local-or-provider",
  "youtube-or-local",
] as const;

export type MusicSource = (typeof MUSIC_SOURCES)[number];

export interface MusicMetadata {
  label: string;
  source: MusicSource;
  url: string;
  volume: number;
  start: number;
  duration: number;
}

export interface RoleMember {
  name: string;
  role: string;
  photo: string;
  photoWidth?: number;
  photoHeight?: number;
  photoFocus?: string;
  linkedin: string;
  shortBio: string;
  bio: string;
  music?: MusicMetadata;
  order?: number;
  slugline?: string;
  accentColor?: string;
  trailColor?: string;
  pathVariant?: PathVariant;
}

export interface RoleContent {
  role: string;
  slug: string;
  slugline: string;
  accentColor: string;
  hoverColor?: string;
  trailColor: string;
  pathVariant: PathVariant;
  order: number;
  music?: MusicMetadata;
  members: RoleMember[];
}

export interface TabContent {
  title: string;
  label: string;
  shortLabel: string;
  slugline: string;
  accentColor: string;
  trailColor: string;
  pathVariant: PathVariant;
  order: number;
  links?: Record<string, string>;
}

export interface SocialContent {
  label: string;
  url: string;
  texture: string;
  accent: string;
  music?: MusicMetadata;
  order?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertPathVariant(value: unknown): asserts value is PathVariant {
  if (!isString(value) || !(PATH_VARIANTS as readonly string[]).includes(value)) {
    throw new TypeError(`Invalid pathVariant: ${String(value)}`);
  }
}

export function parseFrontmatter(markdown: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: markdown.trim() };

  const [, raw = "", body = ""] = match;
  const data = raw.startsWith("{")
    ? (JSON.parse(raw) as Record<string, unknown>)
    : parseScalarFrontmatter(raw);

  return { data, body: body.trim() };
}

function parseFrontmatterValue(value: string): string | number {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseScalarFrontmatter(raw: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const line of raw.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;

    data[line.slice(0, colon).trim()] = parseFrontmatterValue(line.slice(colon + 1));
  }

  return data;
}

function assertMusic(value: unknown): asserts value is MusicMetadata {
  if (!isRecord(value)) throw new TypeError("Music metadata must be an object");
  if (!isString(value.label)) throw new TypeError("Music label is required");
  if (!isString(value.source) || !(MUSIC_SOURCES as readonly string[]).includes(value.source)) {
    throw new TypeError(`Invalid music source: ${String(value.source)}`);
  }
  if (!isString(value.url)) throw new TypeError("Music url is required");
  if (!isNumber(value.volume)) throw new TypeError("Music volume is required");
  if (!isNumber(value.start)) throw new TypeError("Music start is required");
  if (!isNumber(value.duration)) throw new TypeError("Music duration is required");
}

function assertMember(value: unknown): asserts value is RoleMember {
  if (!isRecord(value)) throw new TypeError("Member must be an object");
  if (!isString(value.name)) throw new TypeError("Member name is required");
  if (!isString(value.role)) throw new TypeError("Member role is required");
  if (!isString(value.photo)) throw new TypeError("Member photo is required");
  if (!isString(value.linkedin)) throw new TypeError("Member linkedin is required");
  if (!isString(value.shortBio)) throw new TypeError("Member shortBio is required");
  if (!isString(value.bio)) throw new TypeError("Member bio is required");
  if (value.music !== undefined) assertMusic(value.music);
  if (value.photoWidth !== undefined && !isNumber(value.photoWidth)) {
    throw new TypeError("Member photoWidth must be numeric");
  }
  if (value.photoHeight !== undefined && !isNumber(value.photoHeight)) {
    throw new TypeError("Member photoHeight must be numeric");
  }
  if (value.photoFocus !== undefined && !isString(value.photoFocus)) {
    throw new TypeError("Member photoFocus must be a string");
  }
}

export function validateRoleContent(value: unknown): RoleContent {
  if (!isRecord(value)) throw new TypeError("Role content must be an object");
  if (!isString(value.role)) throw new TypeError("Role is required");
  if (!isString(value.slug)) throw new TypeError("Role slug is required");
  if (!isString(value.slugline)) throw new TypeError("Role slugline is required");
  if (!isString(value.accentColor)) throw new TypeError("Role accentColor is required");
  if (!isString(value.trailColor)) throw new TypeError("Role trailColor is required");
  if (!isNumber(value.order)) throw new TypeError("Role order is required");
  assertPathVariant(value.pathVariant);
  if (value.music !== undefined) assertMusic(value.music);
  if (!Array.isArray(value.members)) throw new TypeError("Role members must be an array");
  for (const member of value.members) {
    assertMember(member);
  }
  return value as unknown as RoleContent;
}

export function validateTabContent(value: unknown): TabContent {
  if (!isRecord(value)) throw new TypeError("Tab content must be an object");
  if (!isString(value.title)) throw new TypeError("Tab title is required");
  if (!isString(value.label)) throw new TypeError("Tab label is required");
  if (!isString(value.shortLabel)) throw new TypeError("Tab shortLabel is required");
  if (!isString(value.slugline)) throw new TypeError("Tab slugline is required");
  if (!isString(value.accentColor)) throw new TypeError("Tab accentColor is required");
  if (!isString(value.trailColor)) throw new TypeError("Tab trailColor is required");
  if (!isNumber(value.order)) throw new TypeError("Tab order is required");
  assertPathVariant(value.pathVariant);
  if (value.links !== undefined) {
    if (!isRecord(value.links)) throw new TypeError("Tab links must be an object");
    for (const [key, link] of Object.entries(value.links)) {
      if (!isString(link)) throw new TypeError(`Tab link ${key} must be a string`);
    }
  }
  return value as unknown as TabContent;
}

export function validateSocialContent(value: unknown): SocialContent {
  if (!isRecord(value)) throw new TypeError("Social content must be an object");
  if (!isString(value.label)) throw new TypeError("Social label is required");
  if (!isString(value.url)) throw new TypeError("Social url is required");
  if (!isString(value.texture)) throw new TypeError("Social texture is required");
  if (!isString(value.accent)) throw new TypeError("Social accent is required");
  if (value.order !== undefined && !isNumber(value.order)) {
    throw new TypeError("Social order must be numeric");
  }
  if (value.music !== undefined) assertMusic(value.music);
  return value as unknown as SocialContent;
}
