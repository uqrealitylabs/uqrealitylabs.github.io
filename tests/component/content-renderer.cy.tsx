import { mount } from "cypress/react";
import { ContentRenderer } from "../../src/content/ContentRenderer";
import type { ContentSection } from "../../src/content/schema/contentSchema";

describe("ContentRenderer", () => {
  it("mounts structured JSON content blocks", () => {
    const sections: ContentSection[] = [
      {
        id: "intro",
        type: "richText",
        blocks: [
          { type: "heading", level: 2, text: "About" },
          { type: "paragraph", text: "JSON content" },
          { type: "cta", label: "Join", href: "/rubrics" },
        ],
      },
    ];

    mount(<ContentRenderer sections={sections} />);

    cy.get("h2").should("have.text", "About");
    cy.contains("p", "JSON content").should("exist");
    cy.get('a[href="/rubrics"]').should("have.text", "Join");
  });
});
