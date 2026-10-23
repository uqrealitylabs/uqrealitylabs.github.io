import { motion } from "./preferences";

function capture(name: string, selector?: string) {
  cy.document().then(async (doc) => {
    const transition = (
      doc as Document & { activeViewTransition?: ViewTransition }
    ).activeViewTransition;
    await transition?.finished;
    await Promise.all(
      doc.getAnimations().map((animation) => animation.finished),
    );
    doc.documentElement.style.scrollBehavior = "auto";
    const header = doc.querySelector<HTMLElement>(".header");
    if (header) header.style.position = "relative";
  });
  if (selector) cy.get(selector).scrollIntoView({ duration: 0 });
  else cy.scrollTo("top", { duration: 0 });
  cy.screenshot(name, {
    capture: selector ? "viewport" : "fullPage",
    scale: true,
  });
}

describe("public journeys", () => {
  beforeEach(() => motion("no-preference"));
  after(() => motion("no-preference"));
  it("reads separate pages and the verified archive without loading 3D", () => {
    motion("reduce");
    cy.viewport(1440, 1000);
    cy.request({ url: "/missing-check-2027", failOnStatusCode: false })
      .its("status")
      .should("eq", 404);
    cy.visit("/");
    cy.get("h1").should("contain", "Reality");
    cy.get("#specimen").should("have.attr", "data-scene", "static");
    cy.get(".menu").click();
    cy.get('#navigation a[href="/about/"]').click();
    cy.location("pathname").should("eq", "/about/");
    cy.contains("a", "Constitution").first().click();
    cy.get("h1").should("have.text", "Constitution");
    cy.contains("a", "constitution on the main branch").should(
      "have.attr",
      "href",
      "https://github.com/uqrealitylabs/constitution/blob/main/Constitution.md",
    );
    cy.visit("/sponsors/");
    cy.contains("h2", "Talk All Sport").should("be.visible");
    cy.get('a[href="https://talkallsport.com/"]').should("be.visible");
    capture("sponsors-desktop");
    cy.visit("/team/2026/");
    cy.contains("h3", "Antra").should("be.visible");
    cy.contains("h3", "Cyrus Forudi").should("be.visible");
    cy.get('meta[name="description"]')
      .should("have.attr", "content")
      .and("not.be.empty");
    capture("archive-desktop");
  });
  it("operates mobile navigation, focus return and React search", () => {
    motion("reduce");
    cy.viewport(390, 844);
    cy.visit("/");
    cy.get(".menu").focus().type("{enter}");
    cy.get(".menu").should("have.attr", "aria-expanded", "true");
    cy.get('#navigation a[href="/team/"]').click();
    cy.location("pathname").should("eq", "/team/");
    cy.get(".search-trigger").click();
    cy.get("#query").type("QuestRelay");
    cy.contains("#search-results a", "QuestRelay").should("be.visible");
    cy.get("#query").clear().type("What is UQRL?");
    cy.contains("#search-results a", "What is UQRL?").should("be.visible");
    cy.get("#search [data-close]").click();
    cy.get(".search-trigger").should("be.focused");
    capture("team-mobile");
    cy.get(".search-trigger").click();
    cy.get("#query").clear().type("QuestRelay");
    cy.contains("#search-results a", "QuestRelay").click();
    cy.location("pathname").should("eq", "/projects/questrelay/");
    cy.get("#search").should("not.be.visible");
    cy.get("#main").should("have.focus");
  });
  it("moves between calendar months by keyboard and exposes a valid subscription", () => {
    motion("reduce");
    cy.viewport(820, 1000);
    cy.clock(Date.parse("2026-10-31T13:59:59Z"), [
      "Date",
      "setTimeout",
      "clearTimeout",
    ]);
    cy.visit("/events/");
    cy.get(".calendar-controls").should("be.visible");
    cy.get(".calendar-table caption")
      .invoke("text")
      .then((current) => {
        cy.get('button[aria-label="Next month"]').focus();
        cy.then(() =>
          Cypress.automation("remote:debugger:protocol", {
            command: "Input.dispatchKeyEvent",
            params: {
              type: "keyDown",
              key: "Enter",
              code: "Enter",
              windowsVirtualKeyCode: 13,
              text: "\r",
            },
          }),
        );
        cy.then(() =>
          Cypress.automation("remote:debugger:protocol", {
            command: "Input.dispatchKeyEvent",
            params: {
              type: "keyUp",
              key: "Enter",
              code: "Enter",
              windowsVirtualKeyCode: 13,
            },
          }),
        );
        cy.get(".calendar-table caption").should("not.have.text", current);
        cy.get("button").contains("Today").click();
        cy.get(".calendar-table caption").should("have.text", current);
      });
    cy.get("#month-empty").should("be.visible");
    cy.tick(2000);
    cy.get(".calendar-table caption").should("have.text", "November 2026");
    cy.get(".is-today > span").should("contain", "1");
    cy.get('a[href="webcal://uqrealitylabs.com/events.ics"]').should(
      "contain",
      "Subscribe",
    );
    cy.request("/events.ics").its("body").should("contain", "BEGIN:VCALENDAR");
    capture("events-tablet");
  });
  it("loads and restores the world after WebGL context loss", () => {
    cy.viewport(1440, 1000);
    cy.visit("/", {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, "gpu", {
          value: undefined,
          configurable: true,
        });
      },
    });
    cy.get("#specimen", { timeout: 15000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    capture("home-desktop", "body");
    cy.get("#canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      const extension = gl?.getExtension("WEBGL_lose_context");
      expect(extension).not.to.be.null;
      extension?.loseContext();
      cy.get("#specimen")
        .should("have.attr", "data-scene", "lost")
        .then(() => extension?.restoreContext());
    });
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
  });
  it("keeps awards textual and loads optional objects", () => {
    cy.viewport(1280, 900);
    cy.visit("/about/");
    cy.get(".award-gallery").scrollIntoView();
    cy.get(".award-object").each(($award) => {
      cy.wrap($award).should("have.attr", "data-scene", "ready");
      cy.wrap($award).find("h3").should("not.be.empty");
      cy.wrap($award).find("canvas").should("be.visible");
    });
    capture("awards-desktop", ".award-gallery");
  });
  it("keeps content visible and 3D opt-in under reduced motion", () => {
    motion("reduce");
    cy.viewport(390, 844);
    cy.visit("/");
    cy.get("#poster").should("be.visible");
    cy.get("#specimen").should("not.have.attr", "data-scene", "ready");
    capture("home-mobile");
    cy.visit("/about/");
    cy.get(".award-gallery").scrollIntoView();
    cy.get(".award-object__load").first().should("be.visible").click();
    cy.get(".award-object")
      .first()
      .should("have.attr", "data-motion", "paused");
  });
});
