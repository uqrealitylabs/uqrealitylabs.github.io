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
  screenX: number;
  screenY: number;
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
    cy.get(".bee-trail--join").invoke("outerWidth").should("be.gt", 150);
    cy.get(".bee-trail__bee").should("not.exist");
    cy.get(".bee-trail--join .bee-trail__orb").should("exist");
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

  it("hides JOIN eyes and shows AWWWW when the pointer gets near", () => {
    cy.visit("/");
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get(".bee-trail--join").should("be.visible");
    cy.get(".bee-trail__join-word").then(([word]) => {
      const rect = word.getBoundingClientRect();
      cy.get("#canvas").trigger("pointermove", {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
        pointerType: "mouse",
      });
    });
    cy.get("body").should("have.attr", "data-join-state", "joinNear");
    cy.get(".bee-trail--join .bee-trail__eye").should(
      "have.css",
      "opacity",
      "0",
    );
    cy.get(".bee-trail--join .bee-trail__thought--near-awwww").should(
      "contain",
      site.animationCopy.nearThought,
    );
    cy.get("#canvas").trigger("pointermove", {
      clientX: 4,
      clientY: 4,
      pointerId: 1,
      pointerType: "mouse",
    });
    cy.get("body").should("have.attr", "data-join-state", "idleCurious");
    cy.get(".bee-trail--join .bee-trail__eye-pupil")
      .first()
      .should("have.attr", "transform")
      .and("match", /^translate/);
  });

  it("keeps the About orb trail scaled and calm in reduced motion", () => {
    cy.viewport(390, 844);
    cy.visit("/", {
      onBeforeLoad(win) {
        cy.stub(win, "matchMedia").callsFake((media) => ({
          matches: media === "(prefers-reduced-motion: reduce)",
          media,
          onchange: null,
          addListener: cy.stub(),
          removeListener: cy.stub(),
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
          dispatchEvent: cy.stub(),
        }));
      },
    });
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    cy.get(".bee-trail--join").should("be.visible");
    cy.get(".bee-trail--join").invoke("outerWidth").should("be.gt", 130);
    cy.get(".bee-trail__bee").should("not.exist");
    cy.get(".bee-trail--join .bee-trail__orb").should("exist");
    cy.get(".bee-trail--join .bee-trail__dot").should("not.be.visible");
    cy.get(".bee-trail--join .bee-trail__path").should(
      "have.css",
      "stroke-dashoffset",
      "0px",
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
        ).to.eql(new Set(["cloth", "rubber", "glass", "grass", "mail"]));
        visibleMaterials.forEach((material: SocialMaterialDebug) => {
          expect(material.hasLogo).to.eq(true);
          expect(material.hasUnderline).to.eq(true);
        });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Email",
          ),
        ).to.include({ kind: "mail" });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Instagram",
          ),
        ).to.include({ kind: "grass", hasGrassLogo: true });
      });
  });

  it("pokes a live grass social card through the canvas", () => {
    cy.visit("/");
    cy.contains("#nav-links button", contact.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "2");
    cy.window()
      .its("__uqrlSocialMaterials")
      .should("be.a", "function")
      .then((readMaterials) => {
        const grass = (readMaterials as () => SocialMaterialDebug[])().find(
          (material) => material.kind === "grass" && material.visible,
        );
        expect(grass).to.exist;
        cy.wrap(grass).as("grassMaterial");
      });

    cy.get<SocialMaterialDebug>("@grassMaterial").then((grass) => {
      cy.get("#canvas").trigger("pointermove", {
        clientX: grass.screenX,
        clientY: grass.screenY,
        pointerId: 1,
        pointerType: "mouse",
        pressure: 0.35,
      });
      cy.get("#canvas").trigger("pointerdown", {
        clientX: grass.screenX,
        clientY: grass.screenY,
        pointerId: 1,
        pointerType: "mouse",
        pressure: 0.9,
      });
    });
    cy.get("body").should("have.attr", "data-material-type", "grass");
    cy.get("body").should("have.attr", "data-interaction-state", "pressed");
    cy.window()
      .its("__uqrlSocialMaterials")
      .should((readMaterials) => {
        const grass = (readMaterials as () => SocialMaterialDebug[])().find(
          (material) => material.kind === "grass" && material.visible,
        );
        expect(grass?.pressure).to.be.greaterThan(0);
      });
  });
});
