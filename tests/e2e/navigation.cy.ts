import {
  getPageContent,
  getSiteContent,
} from "../../src/content/contentRegistry";

const home = getPageContent("en", "home");
const about = getPageContent("en", "about");
const joinCta = about.hero.cta ?? { href: "", label: "" };
const site = getSiteContent("en");

describe("navigation shell", () => {
  it("loads the app shell and keeps JSON-backed nav available", () => {
    cy.visit("/");
    cy.get("nav[aria-label='Main']").should("exist");
    cy.get("#nav-links button").its("length").should("be.gte", 5);
    cy.contains("#nav-links button", home.nav.label).should("exist");
    cy.get("#canvas").should("exist");
  });

  it("keeps basic keyboard and canvas accessibility hooks", () => {
    cy.visit("/");
    cy.get("#nav-links button").first().focus().should("have.focus");
    cy.get("#nav-links button[aria-current='page']").should(
      "contain",
      home.nav.label,
    );
    cy.get("#canvas").should("have.attr", "aria-label").and("not.be.empty");
  });

  it("exposes keyboard-safe fallbacks for canvas-only join and social links", () => {
    cy.visit("/");
    cy.get("#join-us-accessible-link")
      .should("have.attr", "href", joinCta?.href)
      .and("have.text", joinCta?.label);

    site.socialLinks.forEach((social) => {
      cy.get("#social-accessible-links")
        .contains("a", social.label)
        .should("have.attr", "href", social.url);
    });
  });
});
