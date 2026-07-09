import {
  getPageContent,
  getSiteContent,
} from "../../src/content/contentRegistry";

const home = getPageContent("en", "home");
const about = getPageContent("en", "about");
const contact = getPageContent("en", "contact");
const joinCta = about.hero.cta ?? { href: "", label: "" };
const site = getSiteContent("en");
type SocialMaterialDebug = {
  label: string;
  kind: string;
  visible: boolean;
  hasLogo: boolean;
  hasUnderline: boolean;
  hasGrassLogo: boolean;
  pressure: number;
};

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

  it("renders the visible living JOIN US face scaffold", () => {
    cy.visit("/");
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    cy.get(".bee-trail--join").should("be.visible");
    cy.get(".bee-trail--join .bee-trail__join-letter").then((letters) => {
      expect([...letters].map((node) => node.textContent).join("")).to.eq(
        site.animationCopy.joinUs.replace(/\s+/g, ""),
      );
    });
    cy.get(".bee-trail--join .bee-trail__eye--o .bee-trail__eye-ring").should(
      "exist",
    );
    cy.get(".bee-trail--join .bee-trail__eye--o .bee-trail__eye-pupil").should(
      "exist",
    );
    cy.get(".bee-trail--join .bee-trail__thought--near-awwww").should(
      "contain",
      site.animationCopy.nearThought,
    );
  });

  it("drives JOIN US reactions from keyboard-safe RUBRICS activation", () => {
    cy.clock();
    cy.visit("/");
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    cy.get(".bee-trail--join").should("be.visible");
    cy.get("#nav-links button").should("have.length.gte", 5);
    cy.get("#join-us-accessible-link").focus();
    cy.get("body").should(
      "have.attr",
      "data-join-state",
      "rubricsHoverExcited",
    );
    cy.get(".bee-trail--join .bee-trail__join-smile").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.tick(3000);
    cy.get("body").should("have.attr", "data-join-state", "rubricsHoverBlush");
    cy.get(".bee-trail--join .bee-trail__kawaii-blush").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.get("#join-us-accessible-link").blur();
    cy.get("body").should("have.attr", "data-join-state", "sadShrivel");
    cy.get(".bee-trail--join .bee-trail__join-frown").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.tick(1000);
    cy.get("body").should("have.attr", "data-join-state", "idleCurious");
  });

  it("shows yay before delayed JOIN navigation", () => {
    cy.clock();
    cy.visit("/");
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    cy.window().then((win) => {
      cy.stub(win, "open").as("open");
    });
    cy.get("#nav-links button").should("have.length.gte", 5);
    cy.get("#join-us-accessible-link")
      .focus()
      .should("be.visible")
      .type("{enter}");
    cy.get("body").should(
      "have.attr",
      "data-join-state",
      "rubricsClickCelebration",
    );
    cy.get(".bee-trail--join .bee-trail__thought--yay").should(
      "contain",
      site.animationCopy.yay,
    );
    cy.tick(500);
    cy.get("@open").should(
      "have.been.calledWith",
      joinCta.href,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("creates visible feelable social material cards from live content", () => {
    cy.visit("/");
    cy.contains("#nav-links button", contact.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "2");
    cy.get("#canvas").should("be.visible");
    cy.window()
      .its("__uqrlSocialMaterials")
      .should("be.a", "function")
      .then((readMaterials) => {
        const materials = (readMaterials as () => SocialMaterialDebug[])();
        const visibleMaterials = materials.filter(
          (material: SocialMaterialDebug) => material.visible,
        );

        expect(visibleMaterials).to.have.length(site.socialLinks.length);
        expect(
          new Set(
            visibleMaterials.map(
              (material: SocialMaterialDebug) => material.kind,
            ),
          ),
        ).to.eql(new Set(["cloth", "rubber", "glass", "grass"]));
        visibleMaterials.forEach((material: SocialMaterialDebug) => {
          expect(material.hasLogo).to.eq(true);
          expect(material.hasUnderline).to.eq(true);
        });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Email",
          ),
        ).to.include({ kind: "grass", hasGrassLogo: true });
      });
  });
});
