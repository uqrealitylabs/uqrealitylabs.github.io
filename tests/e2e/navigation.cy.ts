import {
  getPageContent,
  getSiteContent,
} from "../../src/content/contentRegistry";

const home = getPageContent("en", "home");
const about = getPageContent("en", "about");
const contact = getPageContent("en", "contact");
const committee = getPageContent("en", "committee");
const joinCta = about.hero.cta ?? { href: "", label: "" };
const site = getSiteContent("en");
const years = site.committee.years.map((entry) => entry.year);

type SocialMaterialDebug = {
  label: string;
  kind: string;
  visible: boolean;
  hasLogo: boolean;
  hasUnderline: boolean;
  logoFillRatio: number;
  underlineScaleY: number;
  pressure: number;
  screenX: number;
  screenY: number;
};

function scrollToViewport(index: number) {
  cy.window().then((win) => {
    win.scrollTo(0, win.innerHeight * index);
  });
}

describe("navigation shell", () => {
  before(() => {
    cy.visit("/");
    cy.get("body", { timeout: 60000 }).should(
      "have.attr",
      "data-scene-ready",
      "true",
    );
  });

  it("loads the app shell and keeps JSON-backed nav available", () => {
    cy.get("nav[aria-label='Main']").should("exist");
    cy.get("#nav-links button").its("length").should("be.gte", 5);
    cy.contains("#nav-links button", home.nav.label).should("exist");
    cy.get("#canvas").should("exist");
  });

  it("keeps basic keyboard and canvas accessibility hooks", () => {
    scrollToViewport(0);
    cy.contains("#nav-links button", home.nav.label).click();
    cy.get("#nav-links button").first().focus().should("have.focus");
    cy.get("#nav-links button[aria-current='page']").should(
      "contain",
      home.nav.label,
    );
    cy.get("#canvas").should("have.attr", "aria-label").and("not.be.empty");
  });

  it("exposes keyboard-safe fallbacks for canvas-only join and social links", () => {
    cy.get("#join-us-accessible-link")
      .should("have.attr", "href", joinCta?.href)
      .and("have.text", joinCta?.label);

    site.socialLinks.forEach((social) => {
      cy.get("#social-accessible-links")
        .contains("a", social.label)
        .should("have.attr", "href", social.url);
    });
  });

  it("keeps the nav expanded and jumps to the committee section", () => {
    cy.get("#navbar").should("not.have.class", "is-condensed");

    cy.contains("#nav-links button", committee.nav.label).click();
    cy.get("body").should("have.attr", "data-on-committee", "true");
  });

  it("navigates committee years from the side rail", () => {
    cy.get("#year-rail button").should("have.length", years.length);
    cy.get("#year-rail button").contains(String(years[0])).click();
    cy.get("body").should("have.attr", "data-committee-year", String(years[0]));

    cy.get("#year-rail button").contains(String(years[1])).click();
    cy.get("body").should("have.attr", "data-committee-year", String(years[1]));
  });

  it("scrolls natively between sections", () => {
    scrollToViewport(0);
    cy.get("body").should("have.attr", "data-section", "0");

    scrollToViewport(1);
    cy.get("body").should("have.attr", "data-section", "1");

    scrollToViewport(2);
    cy.get("body").should("have.attr", "data-section", "2");
    cy.contains("#nav-links button", contact.nav.label).should(
      "have.attr",
      "aria-current",
      "page",
    );
  });

  it("creates visible feelable social material cards from live content", () => {
    scrollToViewport(2);
    cy.get("body").should("have.attr", "data-section", "2");
    cy.get("body").should("have.attr", "data-social-materials-ready", "true");
    cy.get("#canvas").should("be.visible");
    cy.window().should((win) => {
      const readMaterials = (
        win as unknown as {
          __uqrlSocialMaterials?: () => SocialMaterialDebug[];
        }
      ).__uqrlSocialMaterials;

      expect(readMaterials).to.be.a("function");
      const materials = readMaterials?.() ?? [];
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
      ).to.eql(new Set(["cloth", "rubber", "glass", "mail"]));
      visibleMaterials.forEach((material: SocialMaterialDebug) => {
        expect(material.hasLogo).to.eq(true);
        expect(material.hasUnderline).to.eq(true);
        expect(material.logoFillRatio).to.be.greaterThan(0.95);
      });
      expect(
        visibleMaterials.find(
          (material: SocialMaterialDebug) => material.label === "Instagram",
        ),
      ).to.include({ kind: "cloth" });
    });
  });

  it("pokes each live social material through the canvas", () => {
    scrollToViewport(2);
    cy.get("body").should("have.attr", "data-social-materials-ready", "true");
    cy.window()
      .its("__uqrlSocialMaterials")
      .should("be.a", "function")
      .then((readMaterials) => {
        const materials = (
          readMaterials as () => SocialMaterialDebug[]
        )().filter((material) => material.visible);
        expect(new Set(materials.map((material) => material.kind))).to.eql(
          new Set(["cloth", "rubber", "glass", "mail"]),
        );
        cy.wrap(materials.sort((a, b) => a.kind.localeCompare(b.kind))).as(
          "materials",
        );
      });

    cy.get("@materials").then((subject) => {
      const materials = subject as unknown as SocialMaterialDebug[];
      materials.forEach((material) => {
        cy.window().then((win) => {
          const readMaterials = (
            win as unknown as {
              __uqrlSocialMaterials: () => SocialMaterialDebug[];
            }
          ).__uqrlSocialMaterials;
          const current = readMaterials().find(
            (item) => item.label === material.label,
          );

          expect(current, material.label).to.exist;
          if (!current) throw new Error(`Missing ${material.label}`);
          expect(current?.visible).to.eq(true);
          const { screenX, screenY } = current;
          cy.get("#canvas").trigger("pointermove", {
            clientX: screenX,
            clientY: screenY,
            pointerId: 1,
            pointerType: "mouse",
            pressure: 0.35,
          });
          cy.get("#canvas").trigger("pointerdown", {
            clientX: screenX,
            clientY: screenY,
            pointerId: 1,
            pointerType: "mouse",
            pressure: 0.9,
          });
          cy.get("body").should(
            "have.attr",
            "data-material-type",
            material.kind,
          );
          cy.get("body").should(
            "have.attr",
            "data-interaction-state",
            "pressed",
          );
          cy.window().should((latestWindow) => {
            const latest = (
              latestWindow as unknown as {
                __uqrlSocialMaterials: () => SocialMaterialDebug[];
              }
            )
              .__uqrlSocialMaterials()
              .find((item) => item.label === material.label);
            expect(latest?.pressure).to.be.greaterThan(0);
            expect(latest?.underlineScaleY).to.be.greaterThan(1);
          });
          cy.get("#canvas").trigger("pointerup", {
            clientX: screenX,
            clientY: screenY,
            pointerId: 1,
            pointerType: "mouse",
          });
        });
      });
    });
  });
});
