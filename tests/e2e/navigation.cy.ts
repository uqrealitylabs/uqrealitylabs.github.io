import {
  getPageContent,
  getSiteContent,
} from "../../src/content/contentRegistry";

const home = getPageContent("en", "home");
const about = getPageContent("en", "about");
const contact = getPageContent("en", "contact");
const joinCta = about.hero.cta ?? { href: "", label: "" };
const site = getSiteContent("en");

function waitForSceneReady() {
  cy.get("body", { timeout: 15000 }).should(
    "have.attr",
    "data-scene-ready",
    "true",
  );
}

function waitForSectionReady() {
  cy.get("body", { timeout: 15000 }).should(
    "have.attr",
    "data-section-ready",
    "true",
  );
}

function expectRendered(selector: string) {
  cy.get(selector).should(($node) => {
    const element = $node[0];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    expect(style.display).not.to.eq("none");
    expect(Number.parseFloat(style.opacity)).to.be.greaterThan(0);
    expect(rect.width).to.be.greaterThan(0);
    expect(rect.height).to.be.greaterThan(0);
  });
}

function dispatchMaterialPointer(
  win: Window,
  material: SocialMaterialDebug,
  type: "pointermove" | "pointerdown" | "pointerup",
  pressure: number,
) {
  const canvas = win.document.querySelector("#canvas");
  const pointerWindow = win as Window & {
    MouseEvent: typeof MouseEvent;
    PointerEvent?: typeof PointerEvent;
  };
  const eventInit = {
    bubbles: true,
    cancelable: true,
    clientX: material.screenX,
    clientY: material.screenY,
    buttons: type === "pointerup" ? 0 : 1,
  };
  expect(canvas).to.exist;
  canvas?.dispatchEvent(
    pointerWindow.PointerEvent
      ? new pointerWindow.PointerEvent(type, {
          ...eventInit,
          isPrimary: true,
          pointerId: 1,
          pointerType: "mouse",
          pressure,
        })
      : new pointerWindow.MouseEvent(type, eventInit),
  );
}

type SocialMaterialDebug = {
  label: string;
  kind: string;
  visible: boolean;
  settled: boolean;
  hasLogo: boolean;
  hasUnderline: boolean;
  hasGrassLogo: boolean;
  grassBladeCount: number;
  logoFillRatio: number;
  underlineScaleY: number;
  pressure: number;
  stains: number;
  scratches: number;
  cuts: number;
  cutBladeCount: number;
  lastHapticKind: string;
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
    waitForSceneReady();
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    waitForSectionReady();
    expectRendered(".bee-trail--join");
    cy.get(".bee-trail--join").should("have.css", "color", "rgb(255, 87, 87)");
    cy.get(".bee-trail--join").invoke("outerWidth").should("be.gt", 150);
    cy.get(".bee-trail__bee").should("not.exist");
    cy.get(".bee-trail--join .bee-trail__orb").should("exist");
    cy.get(".bee-trail--join .bee-trail__join-letter").then((letters) => {
      expect([...letters].map((node) => node.textContent).join("")).to.eq(
        site.animationCopy.joinUs.replace(/\s+/g, ""),
      );
    });
    cy.get(".bee-trail--join .bee-trail__eye--o .bee-trail__eye-ring").should(
      "have.css",
      "fill",
      "rgb(255, 243, 210)",
    );
    cy.get(".bee-trail--join .bee-trail__eye--o .bee-trail__eye-pupil").should(
      "have.css",
      "fill",
      "rgb(107, 63, 31)",
    );
    cy.get(".bee-trail--join .bee-trail__eye--u").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.get(".bee-trail--join .bee-trail__thought--near-awwww").should(
      "contain",
      site.animationCopy.nearThought,
    );
  });

  it("hides JOIN eyes and shows AWWWW when the pointer gets near", () => {
    cy.visit("/");
    waitForSceneReady();
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    waitForSectionReady();
    expectRendered(".bee-trail--join");
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
    cy.get(".bee-trail--join .bee-trail__eye").should(
      "have.css",
      "transition-property",
      "none",
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
    waitForSceneReady();
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    waitForSectionReady();
    cy.get("body").should("have.attr", "data-reduced-motion", "true");
    expectRendered(".bee-trail--join");
    cy.get(".bee-trail--join").invoke("outerWidth").should("be.gt", 130);
    cy.get(".bee-trail__bee").should("not.exist");
    cy.get(".bee-trail--join .bee-trail__orb").should("exist");
    expectRendered(".bee-trail--join .bee-trail__dot");
    cy.get(".bee-trail--join .bee-trail__orb-drift").should(
      "have.css",
      "animation-name",
      "none",
    );
    cy.get(".bee-trail--join .bee-trail__path").should(
      "have.css",
      "stroke-dashoffset",
      "0px",
    );
  });

  it("drives JOIN US reactions from keyboard-safe RUBRICS activation", () => {
    cy.visit("/");
    waitForSceneReady();
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    waitForSectionReady();
    cy.clock();
    expectRendered(".bee-trail--join");
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
    cy.get(".bee-trail--join .bee-trail__eye--u").should(
      "have.css",
      "animation-name",
      "join-u-hover-wink",
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
    cy.get(".bee-trail--join").should("have.css", "color", "rgb(56, 189, 248)");
    cy.get(".bee-trail--join .bee-trail__join-frown").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.get(".bee-trail--join .bee-trail__join-tear").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.get(".bee-trail--join .bee-trail__thought--sad-ow").should(
      "contain",
      site.animationCopy.ow,
    );
    cy.get(".bee-trail--join .bee-trail__thought--sad-aw").should("not.exist");
    cy.get(".bee-trail--join .bee-trail__dust").should(
      "have.css",
      "opacity",
      "1",
    );
    cy.tick(760);
    cy.get("body").should("have.attr", "data-join-state", "recoveringToIdle");
    cy.tick(180);
    cy.get("body").should("have.attr", "data-join-state", "idleCurious");
  });

  it("shows yay before delayed JOIN navigation", () => {
    cy.visit("/");
    waitForSceneReady();
    cy.contains("#nav-links button", about.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "1");
    waitForSectionReady();
    cy.clock();
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
    waitForSceneReady();
    cy.contains("#nav-links button", contact.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "2");
    waitForSectionReady();
    cy.get("#canvas").should("be.visible");
    cy.window({ timeout: 15000 }).should((win) => {
      const readMaterials = (
        win as unknown as {
          __uqrlSocialMaterials?: () => SocialMaterialDebug[];
        }
      ).__uqrlSocialMaterials;
      expect(readMaterials).to.be.a("function");
      if (readMaterials) {
        const materials = readMaterials();
        const visibleMaterials = materials.filter(
          (material: SocialMaterialDebug) => material.visible,
        );

        expect(visibleMaterials).to.have.length(site.socialLinks.length);
        expect(visibleMaterials.every((material) => material.settled)).to.eq(
          true,
        );
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
          expect(material.logoFillRatio).to.be.greaterThan(0.95);
        });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Email",
          ),
        ).to.include({ kind: "grass", hasGrassLogo: true });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Instagram",
          ),
        ).to.include({ kind: "cloth", hasGrassLogo: false });
        expect(
          visibleMaterials.find(
            (material: SocialMaterialDebug) => material.label === "Email",
          )?.grassBladeCount,
        ).to.be.greaterThan(300);
      }
    });
  });

  it("pokes each live social material through the canvas", () => {
    cy.visit("/");
    waitForSceneReady();
    cy.contains("#nav-links button", contact.nav.label).click();
    cy.get("body").should("have.attr", "data-section", "2");
    waitForSectionReady();
    cy.window()
      .its("__uqrlSocialMaterials")
      .should("be.a", "function")
      .should((readMaterials) => {
        const materials = (
          readMaterials as () => SocialMaterialDebug[]
        )().filter((material) => material.visible);
        expect(materials.every((material) => material.settled)).to.eq(true);
        expect(new Set(materials.map((material) => material.kind))).to.eql(
          new Set(["cloth", "rubber", "glass", "grass"]),
        );
      })
      .then((readMaterials) => {
        const materials = (
          readMaterials as unknown as () => SocialMaterialDebug[]
        )().filter((material) => material.visible);
        cy.wrap(materials.sort((a, b) => a.kind.localeCompare(b.kind))).as(
          "materials",
        );
      });

    cy.get("@materials").then((subject) => {
      const materials = subject as unknown as SocialMaterialDebug[];
      materials.forEach((material) => {
        cy.window().then((win) => {
          const current =
            (
              win as unknown as {
                __uqrlSocialMaterials: () => SocialMaterialDebug[];
              }
            )
              .__uqrlSocialMaterials()
              .find((item) => item.label === material.label) ?? material;
          dispatchMaterialPointer(win, current, "pointermove", 0.35);
          dispatchMaterialPointer(win, current, "pointerdown", 0.9);
        });
        cy.get("body").should("have.attr", "data-material-type", material.kind);
        cy.get("body").should("have.attr", "data-interaction-state", "pressed");
        cy.window().should((win) => {
          const readMaterials = (
            win as unknown as {
              __uqrlSocialMaterials: () => SocialMaterialDebug[];
            }
          ).__uqrlSocialMaterials;
          const current = readMaterials().find(
            (item) => item.label === material.label,
          );
          expect(current?.pressure).to.be.greaterThan(0);
          expect(current?.underlineScaleY).to.be.greaterThan(1);
          if (material.kind === "glass") {
            expect(current?.stains).to.be.greaterThan(0);
          }
          if (material.kind === "rubber" || material.kind === "cloth") {
            expect(current?.lastHapticKind).to.match(/press|damage|contact/);
          }
          if (material.kind === "grass") {
            expect(current?.grassBladeCount).to.be.greaterThan(300);
          }
        });
        cy.window().then((win) => {
          const current =
            (
              win as unknown as {
                __uqrlSocialMaterials: () => SocialMaterialDebug[];
              }
            )
              .__uqrlSocialMaterials()
              .find((item) => item.label === material.label) ?? material;
          dispatchMaterialPointer(win, current, "pointerup", 0);
        });
      });
    });
  });
});
