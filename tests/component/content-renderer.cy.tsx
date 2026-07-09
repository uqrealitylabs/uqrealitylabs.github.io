import { mount } from "cypress/react";
import { ContentRenderer } from "../../src/content/ContentRenderer";
import { getPageContent } from "../../src/content/contentRegistry";
import type { ContentBlock } from "../../src/content/schema/contentSchema";

describe("ContentRenderer", () => {
  it("mounts resolved JSON content blocks", () => {
    const page = getPageContent("en", "about");
    const cta = page.hero.cta;
    const blocks: ContentBlock[] = [...page.hero.body];
    if (cta) blocks.push({ type: "cta", label: cta.label, href: cta.href });
    const paragraph = page.hero.body.find(
      (block) => block.type === "paragraph",
    );

    mount(
      <ContentRenderer
        sections={[
          {
            id: "intro",
            type: "richText",
            blocks,
          },
        ]}
      />,
    );

    if (paragraph)
      cy.contains("p", paragraph.text.split("\n")[0]).should("exist");
    if (cta) cy.get(`a[href="${cta.href}"]`).should("have.text", cta.label);
  });
});
