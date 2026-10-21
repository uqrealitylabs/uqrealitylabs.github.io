import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import MarkdownIt from "markdown-it";
import { parse } from "smol-toml";
import { isSafeHref } from "./schema.ts";

export const contentRoot = resolve("public/assets/content");
const markdown = new MarkdownIt({ html: false, linkify: false });
markdown.validateLink = (url) => isSafeHref(url) || /^#[a-z\d-]+$/i.test(url);

export type Document = {
  title: string;
  slug: string;
  slugline: string;
  description: string;
  order: number;
  draft: boolean;
  body: string;
  html: string;
  file: string;
  [key: string]: unknown;
};
export type Event = Document & {
  id: string;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  ctaLabel: string;
  ctaUrl: string;
  image: string;
  tags: string[];
  featured: boolean;
  updatedAt: string;
  cancelled: boolean;
};
export type Project = Document & {
  status: "idea" | "active" | "shipped" | "archived";
  summary: string;
  team: string[];
  coverImage: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  tags: string[];
  year: string;
  featured: boolean;
};
export type Award = {
  id: string;
  title: string;
  year: number;
  description: string;
  link: string;
  visual: "trophy" | "medal" | "plaque" | "badge" | "certificate";
  order: number;
};
export type Sponsor = {
  id: string;
  name: string;
  logo: string;
  url: string;
  years: number[];
  current: boolean;
  order: number;
};
export type Person = {
  id: string;
  name: string;
  role: string;
  group: "t3" | "officers" | "general";
  photo: string;
  linkedin: string;
  order: number;
};
export type Term = {
  year: number;
  title: string;
  current: boolean;
  published: boolean;
  people: Person[];
};

function fail(file: string, field: string, message: string): never {
  throw new Error(`${file}.${field}: ${message}`);
}
function text(
  data: Record<string, unknown>,
  key: string,
  file: string,
  fallback?: string,
) {
  const value = data[key] ?? fallback;
  if (typeof value !== "string" || (!value.trim() && fallback === undefined))
    fail(file, key, "expected text");
  return value;
}
function strings(value: unknown, file: string, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    fail(file, field, "expected a list of strings");
  return value as string[];
}
function number(value: unknown, file: string, field: string, fallback = 0) {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value))
    fail(file, field, "expected a finite number");
  return value;
}
function bool(value: unknown, file: string, field: string, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") fail(file, field, "expected true or false");
  return value;
}
export function validateAsset(path: string, file = "content") {
  if (!path) return;
  if (!/^\/assets\/[a-z\d/_.-]+$/i.test(path) || path.includes(".."))
    fail(file, path, "expected a local /assets/ path");
  let location = resolve("public");
  for (const segment of path.slice(1).split("/")) {
    if (!readdirSync(location).includes(segment))
      fail(file, path, "asset is missing or filename casing differs");
    location = join(location, segment);
  }
  if (!existsSync(location)) fail(file, path, "asset does not exist");
}
function link(value: string, file: string, field: string) {
  if (value && !isSafeHref(value)) fail(file, field, "expected a safe link");
  return value;
}

export function parseDocument(source: string, file: string): Document {
  if (Buffer.byteLength(source) > 128_000)
    fail(file, "body", "document exceeds 128 KB");
  const normalised = source.replaceAll("\r\n", "\n");
  const end = normalised.indexOf("\n+++\n", 4);
  if (!normalised.startsWith("+++\n") || end < 0)
    fail(file, "frontmatter", "use TOML frontmatter between +++ lines");
  const data = parse(normalised.slice(4, end)) as Record<string, unknown>;
  const body = normalised.slice(end + 5);
  const tokens = markdown.parse(body, {});
  if (tokens.length > 4096 || tokens.some((token) => token.level > 20))
    fail(file, "body", "document structure exceeds safe limits");
  const levels = tokens
    .filter((token) => token.type === "heading_open")
    .map((token) => Number(String(token.tag).slice(1)));
  const shift = levels.length ? 2 - Math.min(...levels) : 0;
  const ids = new Map<string, number>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading_open") {
      const base =
        (tokens[i + 1]?.content ?? "section")
          .normalize("NFKD")
          .toLowerCase()
          .replace(/[^a-z\d]+/g, "-")
          .replace(/^-|-$/g, "") || "section";
      const count = (ids.get(base) ?? 0) + 1;
      ids.set(base, count);
      token.attrSet("id", count > 1 ? `${base}-${count}` : base);
    }
    if (token.type === "heading_open" || token.type === "heading_close")
      token.tag = `h${Math.min(6, Number(String(token.tag).slice(1)) + shift)}`;
    for (const child of token.children ?? []) {
      if (child.type === "image")
        validateAsset(String(child.attrGet("src") ?? ""), file);
    }
  }
  const slug = text(
    data,
    "slug",
    file,
    file.replace(/\.md$/, "").split("/").at(-1) ?? "",
  );
  if (!/^[a-z\d]+(?:-[a-z\d]+)*$/.test(slug))
    fail(file, "slug", "use lowercase words separated by hyphens");
  return {
    ...data,
    title: text(data, "title", file),
    slug,
    slugline: text(data, "slugline", file, ""),
    description: text(data, "description", file),
    order: number(data.order, file, "order"),
    draft: bool(data.draft, file, "draft"),
    body,
    html: markdown.renderer.render(tokens, markdown.options, {}),
    file,
  };
}

export function documents(kind: "about" | "events" | "projects") {
  const dir = join(contentRoot, kind);
  if (!existsSync(dir)) return [];
  const result = readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) =>
      parseDocument(readFileSync(join(dir, file), "utf8"), `${kind}/${file}`),
    );
  if (new Set(result.map((item) => item.slug)).size !== result.length)
    fail(kind, "slug", "duplicate slugs");
  return result.sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

function validTimestamp(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, y, m, d, h, min, sec] = match;
  return (
    Number(m) >= 1 &&
    Number(m) <= 12 &&
    Number(d) >= 1 &&
    Number(d) <= new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate() &&
    Number(h) < 24 &&
    Number(min) < 60 &&
    Number(sec ?? 0) < 60
  );
}
export function parseEvent(doc: Document): Event {
  const startDate = text(doc, "startDate", doc.file);
  const endDate = text(doc, "endDate", doc.file);
  if (
    ![startDate, endDate].every(validTimestamp) ||
    Date.parse(endDate) <= Date.parse(startDate)
  )
    fail(
      doc.file,
      "startDate/endDate",
      "use valid ISO dates with timezone; end must follow start",
    );
  const updatedAt = text(doc, "updatedAt", doc.file);
  if (!validTimestamp(updatedAt))
    fail(doc.file, "updatedAt", "expected an ISO timestamp");
  const id = text(doc, "id", doc.file);
  if (!/^[a-z\d-]+$/.test(id))
    fail(doc.file, "id", "expected a stable lowercase identifier");
  const image = text(doc, "image", doc.file, "");
  validateAsset(image, doc.file);
  return {
    ...doc,
    id,
    startDate,
    endDate,
    updatedAt,
    image,
    location: text(doc, "location", doc.file),
    address: text(doc, "address", doc.file, ""),
    ctaLabel: text(doc, "ctaLabel", doc.file, ""),
    ctaUrl: link(text(doc, "ctaUrl", doc.file, ""), doc.file, "ctaUrl"),
    tags: strings(doc.tags ?? [], doc.file, "tags"),
    featured: bool(doc.featured, doc.file, "featured"),
    cancelled: bool(doc.cancelled, doc.file, "cancelled"),
  };
}
export function events(): Event[] {
  const result = documents("events")
    .map(parseEvent)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
  if (new Set(result.map((event) => event.id)).size !== result.length)
    fail("events", "id", "duplicate stable identifiers");
  return result;
}

export function projects(): Project[] {
  return documents("projects")
    .map((doc) => {
      const status = text(doc, "status", doc.file);
      if (!["idea", "active", "shipped", "archived"].includes(status))
        fail(doc.file, "status", "expected idea, active, shipped or archived");
      const coverImage = text(doc, "coverImage", doc.file, "");
      validateAsset(coverImage, doc.file);
      return {
        ...doc,
        status: status as Project["status"],
        summary: text(doc, "summary", doc.file),
        team: strings(doc.team ?? [], doc.file, "team"),
        coverImage,
        demoUrl: link(text(doc, "demoUrl", doc.file, ""), doc.file, "demoUrl"),
        repoUrl: link(text(doc, "repoUrl", doc.file, ""), doc.file, "repoUrl"),
        videoUrl: link(
          text(doc, "videoUrl", doc.file, ""),
          doc.file,
          "videoUrl",
        ),
        tags: strings(doc.tags ?? [], doc.file, "tags"),
        year: text(doc, "year", doc.file),
        featured: bool(doc.featured, doc.file, "featured"),
      };
    })
    .sort(
      (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
    );
}

export function dataFile(name: string): Record<string, unknown> {
  if (!/^[a-z\d/-]+$/.test(name) || name.includes(".."))
    throw new Error("Invalid content filename");
  return parse(
    readFileSync(join(contentRoot, `${name}.toml`), "utf8"),
  ) as Record<string, unknown>;
}

export function places() {
  return tables(dataFile("world").places, "world.toml").map((item) => {
    const longitude = number(
      item.longitude,
      "world.toml",
      "longitude",
      Number.NaN,
    );
    const latitude = number(
      item.latitude,
      "world.toml",
      "latitude",
      Number.NaN,
    );
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      Math.abs(longitude) > 180 ||
      Math.abs(latitude) > 90
    )
      fail("world.toml", "coordinates", "outside geographic bounds");
    return {
      name: text(item, "name", "world.toml"),
      longitude,
      latitude,
      kind: text(item, "kind", "world.toml"),
      offset: number(item.offset, "world.toml", "offset"),
    };
  });
}
function tables(value: unknown, file: string): Record<string, unknown>[] {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    )
  )
    fail(file, "records", "expected an array of tables");
  return value;
}
export function awards(): Award[] {
  return tables(dataFile("awards").awards ?? [], "awards")
    .map((data) => {
      const id = text(data, "id", "awards");
      const visual = text(data, "visual", id);
      if (
        !["trophy", "medal", "plaque", "badge", "certificate"].includes(visual)
      )
        fail(id, "visual", "unknown award visual");
      return {
        id,
        title: text(data, "title", id),
        year: number(data.year, id, "year"),
        description: text(data, "description", id),
        link: link(text(data, "link", id, ""), id, "link"),
        visual: visual as Award["visual"],
        order: number(data.order, id, "order"),
      };
    })
    .sort((a, b) => a.order - b.order);
}
export function sponsors(): Sponsor[] {
  return tables(dataFile("sponsors").sponsors ?? [], "sponsors")
    .map((data) => {
      const id = text(data, "id", "sponsors");
      const logo = text(data, "logo", id);
      validateAsset(logo, id);
      const years = data.years ?? [];
      if (
        !Array.isArray(years) ||
        years.some((year) => !Number.isInteger(year))
      )
        fail(id, "years", "expected years");
      return {
        id,
        name: text(data, "name", id),
        logo,
        url: link(text(data, "url", id, ""), id, "url"),
        years: years as number[],
        current: bool(data.current, id, "current"),
        order: number(data.order, id, "order"),
      };
    })
    .sort((a, b) => a.order - b.order);
}
export function terms(): Term[] {
  const dir = join(contentRoot, "committee");
  const result = readdirSync(dir)
    .filter((file) => file.endsWith(".toml"))
    .map((file) => {
      const data = dataFile(`committee/${file.replace(".toml", "")}`);
      const people = tables(data.people ?? [], file).map((person) => {
        const id = text(person, "id", file);
        const photo = text(person, "photo", file, "");
        validateAsset(photo, file);
        const group = text(person, "group", file);
        if (!["t3", "officers", "general"].includes(group))
          fail(file, "group", "expected t3, officers or general");
        return {
          id,
          name: text(person, "name", file),
          role: text(person, "role", file),
          group,
          photo,
          linkedin: link(text(person, "linkedin", file, ""), file, "linkedin"),
          order: number(person.order, file, "order"),
        } as Person;
      });
      return {
        year: number(data.year, file, "year"),
        title: text(data, "title", file),
        current: bool(data.current, file, "current"),
        published: bool(data.published, file, "published"),
        people,
      };
    })
    .sort((a, b) => b.year - a.year);
  const published = result.filter((term) => term.published);
  if (
    published.some(
      (term) =>
        !Number.isInteger(term.year) || term.year < 1900 || term.year > 2200,
    ) ||
    new Set(published.map((term) => term.year)).size !== published.length
  )
    fail(
      "committee",
      "year",
      "published terms need unique years from 1900 to 2200",
    );
  if (published.filter((term) => term.current).length > 1)
    fail("committee", "current", "only one term can be current");
  return result;
}

export function portrait(path: string, width: 400 | 800) {
  return path.replace(/\.[^.]+$/, `-${width}.webp`);
}
