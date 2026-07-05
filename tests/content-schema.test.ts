import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseFrontmatter,
  validateRoleContent,
  validateSocialContent,
  validateTabContent,
} from "../app/site-schema";

const root = process.cwd();
const contentDir = join(root, "static", "content");

function readMarkdownFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("content schema", () => {
  test("role markdown validates and carries music metadata", () => {
    const roleFiles = readdirSync(join(contentDir, "roles")).filter((file) => file.endsWith(".md"));

    expect(roleFiles).toHaveLength(7);

    for (const file of roleFiles) {
      const { data } = parseFrontmatter(readMarkdownFile(join(contentDir, "roles", file)));
      const role = validateRoleContent(data);

      expect(role.slug).toBeTruthy();
      expect(role.slugline).toBeTruthy();
      expect(role.accentColor).toMatch(/^#/);
      expect(role.trailColor).toMatch(/^#/);
      expect(role.members.length).toBeGreaterThan(0);
      expect(role.music).toBeDefined();
    }
  });

  test("cyrus keeps the exact meme-song override", () => {
    const { data } = parseFrontmatter(readMarkdownFile(join(contentDir, "roles", "president.md")));
    const role = validateRoleContent(data);
    const cyrus = role.members.find((member) => member.name === "Cyrus Forudi");

    expect(cyrus?.music).toEqual({
      label: "OIIA OIIA",
      source: "youtube",
      url: "https://www.youtube.com/watch?v=90DC_ri0WEY",
      volume: 0.35,
      start: 0,
      duration: 5,
    });
  });

  test("tab markdown validates", () => {
    const tabFiles = readdirSync(join(contentDir, "tabs")).filter((file) => file.endsWith(".md"));
    const pageFiles = tabFiles.filter((file) => file !== "socials.md");

    expect(pageFiles).toHaveLength(5);

    for (const file of pageFiles) {
      const { data } = parseFrontmatter(readMarkdownFile(join(contentDir, "tabs", file)));
      const tab = validateTabContent(data);

      expect(tab.title).toBeTruthy();
      expect(tab.slugline).toBeTruthy();
      expect(tab.pathVariant).toBeTruthy();
      expect(tab.accentColor).toMatch(/^#/);
    }
  });

  test("social metadata stays complete and musical", () => {
    const { data } = parseFrontmatter(readMarkdownFile(join(contentDir, "tabs", "socials.md")));
    const socials = Array.isArray(data.socials) ? data.socials : [];

    expect(socials).toHaveLength(4);

    for (const social of socials.map(validateSocialContent)) {
      expect(social.music).toBeDefined();
      expect(social.texture).toMatch(/^\/Assets\/images\//);
      expect(social.url).toMatch(/^(https?:|mailto:)/);
    }
  });
});
