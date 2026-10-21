import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseContent } from "../../src/content/load.ts";
import { allPages } from "../../src/content/pages.tsx";
import {
  parseDocument,
  parseEvent,
  terms,
  validateAsset,
} from "../../src/content/records.ts";
import { isSafeHref } from "../../src/content/schema.ts";
import {
  buildSitemap,
  renderHeadBlock,
  serializeJsonLd,
} from "../../src/content/seo.ts";
import { assertValidContent } from "../../src/content/validate.ts";
import { Calendar } from "../../src/site/calendar.tsx";
import { Layout } from "../../src/site/layout.tsx";

const pages = allPages(new Date("2026-10-21T00:00:00Z"));
const fixture = `+++\ntitle = "Lab night"\nslug = "lab-night"\ndescription = "Build something"\nid = "lab-night-2026"\nstartDate = "2026-10-21T18:00:00+10:00"\nendDate = "2026-10-21T20:00:00+10:00"\nupdatedAt = "2026-10-01T00:00:00Z"\nlocation = "UQ"\n+++\n`;
const event = parseEvent(parseDocument(fixture, "fixture.md"));

describe("editable content and static React pages", () => {
  it("validates every source, real asset and 2026 roster", () => {
    expect(() => assertValidContent()).not.toThrow();
    expect(terms()[0]).toMatchObject({ year: 2026, published: true });
    expect(terms()[0].people.map((person) => person.name)).toContain("Antra");
    expect(() => validateAsset("/assets/people/Cyrus.webp")).toThrow(/casing/);
    expect(() => parseContent('title = "unterminated', "broken.toml")).toThrow(
      /broken.toml/,
    );
  });
  it("prioritises the current T3, officers and general committee with optional history", () => {
    const html = renderToStaticMarkup(
      pages.find((page) => page.key === "team")?.body,
    );
    expect(
      [...html.matchAll(/data-group="([^"]+)"/g)].map((match) => match[1]),
    ).toEqual(["t3", "officers", "general"]);
    expect(html.indexOf("Cyrus Forudi")).toBeLessThan(
      html.indexOf("Chloe Lim"),
    );
    expect(html.indexOf("Chloe Lim")).toBeLessThan(html.indexOf("Antra"));
    expect(html).toContain('<details class="committee-timeline">');
    expect(html).not.toContain('<details class="committee-timeline" open');
    expect(html).not.toContain('href="/team/0/"');
  });
  it("renders every route with unique metadata, one H1 and working internal page links", () => {
    const routes = new Set(pages.map((page) => page.path));
    expect(routes.size).toBe(pages.length);
    for (const page of pages) {
      const html = renderToStaticMarkup(
        <Layout page={page}>{page.body}</Layout>,
      );
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).not.toContain("undefined");
      for (const [, path] of html.matchAll(/href="(\/[^"#?]*)"/g))
        if (!path.startsWith("/assets/") && !path.endsWith(".ics"))
          expect(routes.has(path), `${page.path} links to ${path}`).toBe(true);
      const head = renderHeadBlock(page, pages);
      expect(head).toContain(
        `<link rel="canonical" href="https://uqrealitylabs.com${page.canonicalPath ?? page.path}">`,
      );
      expect(head).toContain('name="description"');
      const graph = JSON.parse(
        head.match(/<script[^>]*>(.*?)<\/script>/s)?.[1] ?? "null",
      );
      expect(graph["@graph"][2].name).toBe(page.title);
    }
    expect(
      renderHeadBlock(pages.find((page) => page.key === "home")!, pages),
    ).toContain("<title>UQ Reality labs</title>");
    const sitemap = buildSitemap(pages);
    expect(sitemap).toContain("/team/2026/");
    expect(sitemap).not.toContain("/archive/");
    expect(sitemap).not.toContain("/logo-lore/");
    expect(sitemap).not.toContain("404.html");
    const base = { ...pages[0], event };
    expect(renderHeadBlock(base, pages)).not.toContain('"@type":"Event"');
    expect(
      renderHeadBlock(
        {
          ...base,
          event: {
            ...event,
            address: "123 Fixture Street, Brisbane QLD 4000, Australia",
          },
        },
        pages,
      ),
    ).toContain('"@type":"PostalAddress"');
  });
  it("preserves project conduct wording and clearly marks unfinished lore", () => {
    const source = readFileSync("docs/CODE_OF_CONDUCT.md", "utf8").trim();
    const record = readFileSync(
      "public/assets/content/about/code-of-conduct.md",
      "utf8",
    );
    expect(record).toContain(source);
    const lore = pages.find((page) => page.key === "doc-logo-lore");
    expect(lore?.indexable).toBe(false);
    expect(renderToStaticMarkup(lore?.body)).toContain("Unfinished");
  });
  it("bounds and sanitises Markdown while keeping semantic headings and useful links", () => {
    const doc = parseDocument(
      `${fixture}# Title\n# Title\n<script>alert(1)</script>\n[Bad](javascript:alert(1))\n[Good](https://uqrealitylabs.com)\n\n| Tool | Use |\n| --- | --- |\n| VR | Lab |`,
      "fixture.md",
    );
    expect(doc.html).toContain('<h2 id="title">');
    expect(doc.html).toContain('id="title-2"');
    expect(doc.html).not.toContain("<script>");
    expect(doc.html).not.toContain('href="javascript:');
    expect(doc.html).toContain("<table>");
    expect(
      parseDocument(`${fixture}## First section`, "fixture.md").html,
    ).toContain('<h2 id="first-section">');
    expect(() =>
      parseDocument(fixture + "x".repeat(128_000), "large.md"),
    ).toThrow(/128 KB/);
    expect(serializeJsonLd({ text: "</script>" })).not.toContain("</script>");
    for (const url of [
      "javascript:alert(1)",
      "//evil.test",
      "/%2fevil.test",
      "/a/../b",
      "/%5cevil",
      "https://user:password@example.com",
      "mailto:a@b?body=%0d%0aBcc:evil",
    ])
      expect(isSafeHref(url), url).toBe(false);
  });
  it("rejects invalid dates and renders leap days, today and multiday events", () => {
    expect(() =>
      parseEvent(
        parseDocument(
          fixture.replace("2026-10-21T18", "2026-02-30T18"),
          "bad.md",
        ),
      ),
    ).toThrow(/valid ISO/);
    expect(() =>
      parseEvent(
        parseDocument(
          fixture.replace("20:00:00+10:00", "17:00:00+10:00"),
          "bad.md",
        ),
      ),
    ).toThrow(/end must follow/);
    const html = renderToStaticMarkup(
      <Calendar
        locale="en"
        events={[
          {
            ...event,
            startDate: "2024-02-28T18:00:00+10:00",
            endDate: "2024-03-01T00:00:00+10:00",
          },
        ]}
        initialDay="2024-02-29"
        labels={{
          today: "Today",
          previous: "Previous",
          next: "Next",
          emptyMonth: "Empty",
        }}
      />,
    );
    expect(html).toContain('class="is-today"');
    expect(html.match(/href="#event-lab-night"/g)).toHaveLength(2);
    expect(html).toContain("February 2024");
  });
});
