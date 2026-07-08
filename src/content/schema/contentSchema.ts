export const locales = ["en", "es"] as const;
export const pageIds = [
  "home",
  "about",
  "contact",
  "sponsors",
  "committee",
  "rubrics",
] as const;
export const blockTypes = [
  "paragraph",
  "heading",
  "list",
  "quote",
  "link",
  "image",
  "cta",
  "callout",
  "socialGrid",
  "rubricList",
  "spacer",
] as const;
const animationCopyKeys = [
  "joinUs",
  "nearThought",
  "sadThought",
  "ow",
  "yay",
  "loading",
] as const;

export type Locale = (typeof locales)[number];
export type PageId = (typeof pageIds)[number];
export type BlockType = (typeof blockTypes)[number];

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "link"; label: string; href: string }
  | {
      type: "image";
      src: string;
      alt?: string;
      decorative?: boolean;
      caption?: string;
    }
  | { type: "cta"; label: string; href: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "socialGrid" }
  | { type: "rubricList"; items: { title: string; text: string }[] }
  | { type: "spacer"; size?: "sm" | "md" | "lg" };

export type ContentSection =
  | { id: string; type: "richText"; blocks: ContentBlock[] }
  | { id: string; type: "socialGrid" }
  | { id: string; type: "committee" };

export type PageContent = {
  $schema?: string;
  locale: Locale;
  id: PageId;
  route: string;
  meta: { title: string; description: string };
  nav: { label: string; shortLabel: string; order: number };
  hero: {
    title: string;
    slugline?: string;
    body: ContentBlock[];
    cta?: { label: string; href: string };
  };
  links?: Record<string, string>;
  theme?: {
    accentColor?: string;
    trailColor?: string;
    pathVariant?: string;
  };
  sections: ContentSection[];
};

export type MusicCue = {
  label: string;
  source: "youtube";
  url: string;
  volume?: number;
  start?: number;
  duration?: number;
};

export type MemberContent = {
  name: string;
  role: string;
  photo: string;
  photoWidth?: number;
  photoHeight?: number;
  photoFocus?: string;
  linkedin: string;
  shortBio: string;
  bio: string;
  accentColor?: string;
  pathVariant?: string;
  music?: MusicCue;
  order?: number;
};

export type RoleContent = {
  role: string;
  slug: string;
  slugline: string;
  microcopy?: string;
  accentColor: string;
  hoverColor?: string;
  trailColor?: string;
  pathVariant?: string;
  order?: number;
  music?: MusicCue;
  members: MemberContent[];
};

export type SiteContent = {
  $schema?: string;
  locale: Locale;
  animationCopy: Record<
    "joinUs" | "nearThought" | "sadThought" | "ow" | "yay" | "loading",
    string
  >;
  socialLinks: {
    label: string;
    url: string;
    texture: string;
    accent: string;
    accentColor?: string;
    music?: MusicCue;
    order?: number;
  }[];
  committee: { rows: string[][]; roles: string[] };
  roles: Record<string, RoleContent>;
};

export type ValidationIssue = {
  path: string;
  message: string;
  expected: string;
  actual: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(
  issues: ValidationIssue[],
  path: string,
  expected: string,
  actual: unknown,
) {
  issues.push({
    path,
    expected,
    actual,
    message: `${path} must be ${expected}`,
  });
}

export function isSafeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("mailto:")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateHref(issues: ValidationIssue[], value: unknown, path: string) {
  if (!hasText(value) || !isSafeHref(value)) {
    issue(issues, path, "an internal, https, or mailto URL", value);
  }
}

function validateAssetPath(
  issues: ValidationIssue[],
  value: unknown,
  path: string,
) {
  if (
    !hasText(value) ||
    !value.startsWith("/Assets/") ||
    value.includes("..")
  ) {
    issue(issues, path, "a safe /Assets/ path", value);
  }
}

function validateBlock(
  block: unknown,
  path: string,
  issues: ValidationIssue[],
) {
  if (!isRecord(block)) return issue(issues, path, "a block object", block);
  if (!blockTypes.includes(block.type as BlockType)) {
    issue(
      issues,
      `${path}.type`,
      `one of ${blockTypes.join(", ")}`,
      block.type,
    );
    return;
  }

  switch (block.type) {
    case "paragraph":
    case "quote":
      if (!hasText(block.text))
        issue(issues, `${path}.text`, "text", block.text);
      break;
    case "heading":
      if (![2, 3, 4].includes(Number(block.level))) {
        issue(issues, `${path}.level`, "2, 3, or 4", block.level);
      }
      if (!hasText(block.text))
        issue(issues, `${path}.text`, "text", block.text);
      break;
    case "list":
      if (!Array.isArray(block.items) || !block.items.every(hasText)) {
        issue(issues, `${path}.items`, "non-empty text items", block.items);
      }
      break;
    case "link":
    case "cta":
      if (!hasText(block.label)) {
        issue(issues, `${path}.label`, "text", block.label);
      }
      validateHref(issues, block.href, `${path}.href`);
      break;
    case "image":
      validateAssetPath(issues, block.src, `${path}.src`);
      if (block.decorative !== true && !hasText(block.alt)) {
        issue(issues, `${path}.alt`, "alt text unless decorative", block.alt);
      }
      break;
    case "callout":
      if (!hasText(block.text))
        issue(issues, `${path}.text`, "text", block.text);
      break;
    case "rubricList":
      if (
        !Array.isArray(block.items) ||
        !block.items.every(
          (item) => isRecord(item) && hasText(item.title) && hasText(item.text),
        )
      ) {
        issue(issues, `${path}.items`, "rubric items", block.items);
      }
      break;
  }
}

export function validatePageContent(
  page: unknown,
  filePath = "page",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(page))
    return [
      {
        path: filePath,
        message: "page must be an object",
        expected: "object",
        actual: page,
      },
    ];

  if (!locales.includes(page.locale as Locale))
    issue(issues, `${filePath}.locale`, "supported locale", page.locale);
  if (!pageIds.includes(page.id as PageId))
    issue(issues, `${filePath}.id`, "known page id", page.id);
  validateHref(issues, page.route, `${filePath}.route`);

  if (!isRecord(page.meta))
    issue(issues, `${filePath}.meta`, "object", page.meta);
  else {
    if (!hasText(page.meta.title))
      issue(issues, `${filePath}.meta.title`, "text", page.meta.title);
    if (!hasText(page.meta.description))
      issue(
        issues,
        `${filePath}.meta.description`,
        "text",
        page.meta.description,
      );
  }

  if (!isRecord(page.nav)) issue(issues, `${filePath}.nav`, "object", page.nav);
  else {
    if (!hasText(page.nav.label))
      issue(issues, `${filePath}.nav.label`, "text", page.nav.label);
    if (!hasText(page.nav.shortLabel))
      issue(issues, `${filePath}.nav.shortLabel`, "text", page.nav.shortLabel);
    if (typeof page.nav.order !== "number")
      issue(issues, `${filePath}.nav.order`, "number", page.nav.order);
  }

  if (!isRecord(page.hero))
    issue(issues, `${filePath}.hero`, "object", page.hero);
  else {
    if (!hasText(page.hero.title))
      issue(issues, `${filePath}.hero.title`, "text", page.hero.title);
    if (!Array.isArray(page.hero.body))
      issue(issues, `${filePath}.hero.body`, "blocks", page.hero.body);
    else {
      page.hero.body.forEach((block, index) => {
        validateBlock(block, `${filePath}.hero.body.${index}`, issues);
      });
    }
    if (isRecord(page.hero.cta)) {
      if (!hasText(page.hero.cta.label))
        issue(
          issues,
          `${filePath}.hero.cta.label`,
          "text",
          page.hero.cta.label,
        );
      validateHref(issues, page.hero.cta.href, `${filePath}.hero.cta.href`);
    }
  }

  if (!Array.isArray(page.sections))
    issue(issues, `${filePath}.sections`, "sections array", page.sections);
  else {
    page.sections.forEach((section, index) => {
      const sectionPath = `${filePath}.sections.${index}`;
      if (!isRecord(section)) {
        issue(issues, sectionPath, "section object", section);
        return;
      }
      if (!hasText(section.id) || !/^[a-z0-9-]+$/.test(section.id))
        issue(issues, `${sectionPath}.id`, "safe id", section.id);
      if (
        !["richText", "socialGrid", "committee"].includes(String(section.type))
      ) {
        issue(
          issues,
          `${sectionPath}.type`,
          "known section type",
          section.type,
        );
      }
      if (section.type === "richText") {
        if (!Array.isArray(section.blocks))
          issue(issues, `${sectionPath}.blocks`, "blocks", section.blocks);
        else {
          section.blocks.forEach((block, blockIndex) => {
            validateBlock(block, `${sectionPath}.blocks.${blockIndex}`, issues);
          });
        }
      }
    });
  }

  if (isRecord(page.links)) {
    for (const [key, href] of Object.entries(page.links)) {
      validateHref(issues, href, `${filePath}.links.${key}`);
    }
  }

  return issues;
}

function validateMusic(
  music: unknown,
  path: string,
  issues: ValidationIssue[],
) {
  if (music === undefined) return;
  if (!isRecord(music)) return issue(issues, path, "music object", music);
  if (!hasText(music.label))
    issue(issues, `${path}.label`, "text", music.label);
  if (music.source !== "youtube")
    issue(issues, `${path}.source`, "youtube", music.source);
  validateHref(issues, music.url, `${path}.url`);
}

export function validateSiteContent(
  site: unknown,
  filePath = "site",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(site))
    return [
      {
        path: filePath,
        message: "site must be an object",
        expected: "object",
        actual: site,
      },
    ];
  if (!locales.includes(site.locale as Locale))
    issue(issues, `${filePath}.locale`, "supported locale", site.locale);
  const animationCopy = isRecord(site.animationCopy)
    ? site.animationCopy
    : null;
  if (!animationCopy)
    issue(
      issues,
      `${filePath}.animationCopy`,
      "copy object",
      site.animationCopy,
    );
  else {
    animationCopyKeys.forEach((key) => {
      if (!hasText(animationCopy[key])) {
        issue(
          issues,
          `${filePath}.animationCopy.${key}`,
          "text",
          animationCopy[key],
        );
      }
    });
  }

  if (!isRecord(site.committee)) {
    issue(issues, `${filePath}.committee`, "committee object", site.committee);
  } else {
    if (
      !Array.isArray(site.committee.roles) ||
      !site.committee.roles.every(hasText)
    ) {
      issue(
        issues,
        `${filePath}.committee.roles`,
        "role slug array",
        site.committee.roles,
      );
    }
    if (
      !Array.isArray(site.committee.rows) ||
      !site.committee.rows.every(
        (row) => Array.isArray(row) && row.every(hasText),
      )
    ) {
      issue(
        issues,
        `${filePath}.committee.rows`,
        "role slug rows",
        site.committee.rows,
      );
    }
  }

  if (!Array.isArray(site.socialLinks))
    issue(issues, `${filePath}.socialLinks`, "social links", site.socialLinks);
  else
    site.socialLinks.forEach((social, index) => {
      const path = `${filePath}.socialLinks.${index}`;
      if (!isRecord(social)) {
        issue(issues, path, "social object", social);
        return;
      }
      if (!hasText(social.label))
        issue(issues, `${path}.label`, "text", social.label);
      validateHref(issues, social.url, `${path}.url`);
      validateAssetPath(issues, social.texture, `${path}.texture`);
      validateMusic(social.music, `${path}.music`, issues);
    });

  if (!isRecord(site.roles))
    issue(issues, `${filePath}.roles`, "roles object", site.roles);
  else
    Object.entries(site.roles).forEach(([slug, role]) => {
      const path = `${filePath}.roles.${slug}`;
      if (!isRecord(role)) {
        issue(issues, path, "role object", role);
        return;
      }
      if (!hasText(role.role)) issue(issues, `${path}.role`, "text", role.role);
      if (!hasText(role.slug)) issue(issues, `${path}.slug`, "text", role.slug);
      if (!hasText(role.slugline))
        issue(issues, `${path}.slugline`, "text", role.slugline);
      validateMusic(role.music, `${path}.music`, issues);
      if (!Array.isArray(role.members))
        issue(issues, `${path}.members`, "members array", role.members);
      else
        role.members.forEach((member, index) => {
          const memberPath = `${path}.members.${index}`;
          if (!isRecord(member)) {
            issue(issues, memberPath, "member object", member);
            return;
          }
          if (!hasText(member.name))
            issue(issues, `${memberPath}.name`, "text", member.name);
          if (!hasText(member.role))
            issue(issues, `${memberPath}.role`, "text", member.role);
          validateAssetPath(issues, member.photo, `${memberPath}.photo`);
          validateHref(issues, member.linkedin, `${memberPath}.linkedin`);
          if (!hasText(member.shortBio))
            issue(issues, `${memberPath}.shortBio`, "text", member.shortBio);
          if (!hasText(member.bio))
            issue(issues, `${memberPath}.bio`, "text", member.bio);
          validateMusic(member.music, `${memberPath}.music`, issues);
        });
    });

  if (isRecord(site.roles) && isRecord(site.committee)) {
    const roleSlugs = new Set(Object.keys(site.roles));
    if (Array.isArray(site.committee.roles)) {
      site.committee.roles.forEach((slug, index) => {
        if (typeof slug === "string" && !roleSlugs.has(slug)) {
          issue(
            issues,
            `${filePath}.committee.roles.${index}`,
            "existing role slug",
            slug,
          );
        }
      });
    }
    if (Array.isArray(site.committee.rows)) {
      site.committee.rows.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) return;
        row.forEach((slug, colIndex) => {
          if (typeof slug === "string" && !roleSlugs.has(slug)) {
            issue(
              issues,
              `${filePath}.committee.rows.${rowIndex}.${colIndex}`,
              "existing role slug",
              slug,
            );
          }
        });
      });
    }
  }

  return issues;
}

export function formatIssues(issues: ValidationIssue[]) {
  return issues
    .map(
      (item) =>
        `${item.path}: expected ${item.expected}, got ${JSON.stringify(item.actual)}`,
    )
    .join("\n");
}
