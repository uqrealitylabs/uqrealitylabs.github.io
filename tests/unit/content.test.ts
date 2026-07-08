import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentRenderer } from "../../src/content/ContentRenderer";
import {
  getPageContent,
  getSiteContent,
  listPages,
  resolveLocale,
} from "../../src/content/contentRegistry";
import {
  type ContentBlock,
  type ContentSection,
  validatePageContent,
  validateSiteContent,
} from "../../src/content/schema/contentSchema";
import { validateAllContent } from "../../src/content/validateContent";

describe("JSON content system", () => {
  it("validates every locale page and site file", () => {
    expect(validateAllContent()).toEqual([]);
  });

  it.each([
    ["en", "home", "UQ Reality Labs est. 2022"],
    ["es", "about", "Acerca"],
  ])("loads %s/%s from JSON", (locale, pageId, title) => {
    expect(getPageContent(locale, pageId).meta.title).toBe(title);
  });

  it("falls unknown locales back to English and rejects unknown pages", () => {
    expect(resolveLocale("fr")).toBe("en");
    expect(listPages("fr")[0].locale).toBe("en");
    expect(() => getPageContent("en", "missing")).toThrow(
      "Unknown content page",
    );
  });

  it("keeps global UI copy separate from page content", () => {
    expect(getSiteContent("en").animationCopy.yay).toBe("yay");
    expect(getPageContent("en", "about").hero.body[0].type).toBe("paragraph");
  });

  it.each([
    [{ route: "javascript:alert(1)" }, "route"],
    [{ nav: { label: "", shortLabel: "Home", order: 1 } }, "nav.label"],
    [{ hero: { body: [{ type: "nope" }] } }, "hero.body.0.type"],
    [
      {
        hero: {
          body: [{ type: "image", src: "/Assets/images/labs_logo.png" }],
        },
      },
      "hero.body.0.alt",
    ],
  ])("rejects unsafe or malformed content: %s", (patch, path) => {
    const valid = getPageContent("en", "home");
    const invalid = {
      ...valid,
      ...patch,
      hero: { ...valid.hero, ...(patch as { hero?: object }).hero },
    };

    expect(
      validatePageContent(invalid).some((issue) => issue.path.endsWith(path)),
    ).toBe(true);
  });

  it.each([
    [{ animationCopy: { yay: "yay" } }, "animationCopy.joinUs"],
    [
      {
        committee: {
          rows: [["missing-role"]],
          roles: ["missing-role"],
        },
      },
      "committee.roles.0",
    ],
  ])("rejects malformed site content: %s", (patch, path) => {
    const valid = getSiteContent("en");
    const invalid = { ...valid, ...patch };

    expect(
      validateSiteContent(invalid).some((issue) => issue.path.endsWith(path)),
    ).toBe(true);
  });
});

describe("ContentRenderer", () => {
  const blockCases: ContentBlock[] = [
    { type: "heading", level: 2, text: "Heading" },
    { type: "paragraph", text: "<script>alert(1)</script>" },
    { type: "list", items: ["One", "Two"] },
    { type: "quote", text: "Quote", cite: "Lab" },
    { type: "link", label: "Link", href: "/about" },
    {
      type: "image",
      src: "/Assets/images/labs_logo.png",
      alt: "Logo",
      caption: "Caption",
    },
    {
      type: "image",
      src: "/Assets/images/labs_logo.png",
      decorative: true,
    },
    { type: "cta", label: "Join", href: "/rubrics" },
    { type: "callout", title: "Note", text: "Callout" },
    { type: "socialGrid" },
    { type: "rubricList", items: [{ title: "Rubric", text: "Text" }] },
    { type: "spacer", size: "sm" },
  ];

  const sections: ContentSection[] = [
    {
      id: "intro",
      type: "richText",
      blocks: blockCases,
    },
    { id: "socials", type: "socialGrid" },
    { id: "committee", type: "committee" },
  ];

  it("renders structured blocks as semantic escaped HTML", () => {
    const html = renderToStaticMarkup(
      createElement(ContentRenderer, { sections }),
    );

    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    expect(html).toContain("<li>One</li>");
    expect(html).toContain('<a href="/rubrics">Join</a>');
    expect(html).toContain("<blockquote>");
    expect(html).toContain(
      '<img src="/Assets/images/labs_logo.png" alt="Logo"',
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-content-slot="social-grid"');
    expect(html).toContain('data-content-slot="committee"');
    expect(html).toContain("<dt>Rubric</dt>");
    expect(html).toContain('data-spacer="sm"');
    expect(html).not.toContain("dangerouslySetInnerHTML");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
