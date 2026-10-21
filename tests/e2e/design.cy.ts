import { motion } from "./preferences";

function scrollJourney(progress: number) {
  cy.window().then((win) => {
    const hero = win.document.querySelector<HTMLElement>(".hero")!;
    win.document.documentElement.style.scrollBehavior = "auto";
    win.scrollTo(
      0,
      hero.offsetTop + (hero.offsetHeight - win.innerHeight) * progress,
    );
    return new Cypress.Promise<void>((resolve) =>
      win.requestAnimationFrame(() =>
        win.requestAnimationFrame(() => resolve()),
      ),
    );
  });
  cy.get("#specimen", { timeout: 10000 }).should(
    "have.attr",
    "data-pose",
    "home",
  );
}
function capturePoster(name: string, launch = "flying") {
  cy.get("#specimen").should("have.attr", "data-materials", "ready");
  cy.get("#specimen").should("have.attr", "data-launch", launch);
  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.id = "poster-capture";
    style.textContent = `.header, .hero__stage > *, .lab-stations, .world-label, .air-invite, .world-weather, .world-traffic, .world-credit { visibility: hidden !important } .hero__stage::after, .world::after { display: none !important }`;
    doc.head.append(style);
  });
  let path = "";
  cy.get(".hero__stage").screenshot(`poster-${name}`, {
    overwrite: true,
    onAfterScreenshot(_element, result) {
      path = result.path;
    },
  });
  cy.then(() => cy.readFile(path, "base64")).then((bytes) =>
    cy.writeFile(`out/artifacts/posters/${name}.png`, bytes, "base64"),
  );
  cy.document().then((doc) => doc.getElementById("poster-capture")?.remove());
}

function feeds() {
  const updated = Math.floor(Date.now() / 1000);
  cy.intercept("GET", "https://api.open-meteo.com/**", {
    body: [0, 1].map(() => ({
      current: {
        time: updated,
        temperature_2m: 24,
        cloud_cover: 70,
        precipitation: 0.2,
        wind_speed_10m: 12,
        wind_direction_10m: 120,
        weather_code: 61,
      },
    })),
  });
  cy.intercept("GET", "/api/world/traffic", {
    body: {
      aircraft: {
        status: "live",
        updated,
        vehicles: [
          {
            id: "TEST",
            longitude: 153.02,
            latitude: -27.48,
            altitude: 350,
            bearing: 120,
            updated,
          },
        ],
      },
      ferries: {
        status: "live",
        updated,
        vehicles: [
          {
            id: "CityCat",
            longitude: 153.023,
            latitude: -27.487,
            altitude: 0,
            bearing: 200,
            updated,
          },
        ],
      },
    },
  });
}

describe("the connected geographic world", () => {
  beforeEach(() => {
    motion("no-preference");
    feeds();
  });
  it("hovers at campus, responds to light and stops offscreen or under reduced motion", () => {
    cy.viewport(1440, 1000);
    let draws = 0;
    cy.visit("/", {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, "gpu", {
          value: undefined,
          configurable: true,
        });
        const prototype = win.WebGL2RenderingContext.prototype;
        const draw = prototype.drawElementsInstanced;
        prototype.drawElementsInstanced = function (...args) {
          draws++;
          return draw.apply(this, args);
        };
      },
    });
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-pose",
      "home",
    );
    cy.get("#specimen").should("have.attr", "data-materials", "ready");
    cy.get("#world-weather").should("contain", "St Lucia");
    cy.get("#world-traffic")
      .should("contain", "1 aircraft")
      .and("contain", "1 ferries");
    cy.then(() => {
      const count = draws;
      cy.wait(250).then(() => expect(draws).to.be.greaterThan(count));
    });
    cy.get("#canvas").trigger("pointermove", {
      clientX: 950,
      clientY: 700,
      pointerType: "mouse",
    });
    cy.scrollTo("bottom", { duration: 0 });
    cy.wait(300).then(() => {
      const count = draws;
      cy.wait(250).then(() => expect(draws).to.equal(count));
    });
    motion("reduce");
    cy.scrollTo("top", { duration: 0 });
    cy.get("#specimen").should("have.attr", "data-motion", "paused");
    cy.wait(300).then(() => {
      const count = draws;
      cy.wait(250).then(() => expect(draws).to.be.at.most(count + 1));
    });
  });
  it("flies continuously to Brisbane and Earth, reverses, and captures the same world on mobile", () => {
    cy.viewport(1440, 1000);
    cy.visit("/");
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    cy.get("#specimen").should("have.attr", "data-parser", "rust-wasm");
    cy.get("#specimen", { timeout: 30000 }).should(
      "have.attr",
      "data-details",
      "ready",
    );
    capturePoster("campus");
    scrollJourney(0.55);
    cy.get(".hero").should("have.attr", "data-chapter", "brisbane");
    cy.get('[data-place="brisbane"] h2').should("be.visible");
    cy.screenshot("world-brisbane", { capture: "viewport" });
    scrollJourney(1);
    cy.get(".hero").should("have.attr", "data-chapter", "australia");
    capturePoster("australia");
    cy.screenshot("world-australia", { capture: "viewport" });
    scrollJourney(0.3);
    scrollJourney(0.9);
    scrollJourney(0);
    cy.get(".hero").should("have.attr", "data-chapter", "campus");
    cy.viewport(390, 844);
    cy.visit("/");
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    scrollJourney(0);
    capturePoster("campus-mobile");
    cy.get("#canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      expect(canvas.width * canvas.height).to.be.at.most(2_000_000);
    });
    scrollJourney(1);
    capturePoster("australia-mobile");
  });
  it("flies into a real capital district and preserves the same canvas across reading routes", () => {
    cy.viewport(1440, 1000);
    let canvas: HTMLCanvasElement;
    cy.visit("/");
    cy.get("#specimen", { timeout: 30000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    cy.get<HTMLCanvasElement>("#canvas").then(($canvas) => {
      canvas = $canvas[0];
    });
    scrollJourney(1);
    cy.get('[data-capital="Sydney"]').click();
    cy.get("#specimen", { timeout: 30000 }).should(
      "have.attr",
      "data-city",
      "Sydney",
    );
    cy.get("#specimen", { timeout: 10000 }).should(
      "have.attr",
      "data-flight",
      "landed",
    );
    cy.screenshot("world-sydney", { capture: "viewport" });
    cy.get(".world-return").click();
    cy.get(".menu").click();
    cy.get('#navigation a[href="/team/"]').click();
    cy.location("pathname").should("eq", "/team/");
    cy.get<HTMLCanvasElement>("#canvas").then(($canvas) =>
      expect($canvas[0]).to.equal(canvas),
    );
    cy.go("back");
    cy.location("pathname").should("eq", "/");
    cy.get<HTMLCanvasElement>("#canvas").then(($canvas) =>
      expect($canvas[0]).to.equal(canvas),
    );
  });
  it("uses a static world with Save-Data, and keeps routes usable after a failed scene load", () => {
    cy.viewport(390, 844);
    cy.visit("/", {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, "connection", {
          value: { saveData: true },
        });
      },
    });
    cy.get("#specimen").should("have.attr", "data-scene", "static");
    cy.get("#poster .poster-campus").should("be.visible");
    cy.get("#scene-load, #reset, [data-journey]").should("not.exist");
    cy.intercept("GET", "/assets/world/campus.json", { statusCode: 503 });
    cy.visit("/");
    cy.get("#specimen").should("have.attr", "data-scene", "error");
    cy.get("#poster .poster-campus").should("be.visible");
    cy.get("#station-about").click();
    cy.location("pathname").should("eq", "/about/");
  });
  it("settles rapid exhibit selection and opens the footer with keyboard and touch", () => {
    cy.viewport(1440, 1000);
    cy.visit("/");
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    for (const key of ["projects", "events", "team"])
      cy.get(`.station__view[data-view="${key}"]`).click();
    cy.get("#specimen").should("have.attr", "data-pose", "team");
    cy.get('.station__view[aria-pressed="true"]').should("have.length", 1);
    cy.get("#room-link").should("have.attr", "href", "/team/");
    cy.get("#room-link").click();
    cy.location("pathname").should("eq", "/team/");
    cy.go("back");
    cy.location("pathname").should("eq", "/");
    cy.get("#specimen").should("have.attr", "data-pose", "team");
    cy.get("#station-team").should("have.focus");
    cy.get(".footer__latch").focus();
    cy.get(".footer").should("have.attr", "data-open", "true");
    cy.get(".footer__pages a").should("have.length", 4);
    cy.get(".footer__socials a[aria-label=Rubric]").should("be.visible");
    cy.get(".footer__socials a[aria-label=Git]").should("be.visible");
    cy.get(".footer__pages a").first().focus().type("{esc}");
    cy.get(".footer").should("have.attr", "data-open", "false");
    cy.viewport(390, 844);
    cy.get(".footer__latch").click();
    cy.get(".footer").should("have.attr", "data-open", "true");
    cy.screenshot("footer-mobile", { capture: "viewport" });
    cy.get(".footer__pages a[href='/team/']").click();
    cy.get(".committee-timeline").should("not.have.attr", "open");
    cy.get(".committee-timeline summary").click();
    cy.get(".committee-timeline").should("have.attr", "open");
    cy.get(".team-archive a").first().click();
    cy.location("pathname").should("eq", "/team/2026/");
  });
  it("switches actual UTC night and day lighting without changing geographic scale", () => {
    cy.clock(Date.parse("2026-10-21T12:00:00Z"), ["Date"]);
    cy.viewport(1440, 1000);
    cy.visit("/");
    cy.get("#specimen", { timeout: 20000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    cy.get("#specimen").should("have.attr", "data-phase", "night");
    cy.get("#specimen").should("have.attr", "data-materials", "ready");
    cy.screenshot("world-night", { capture: "viewport" });
    cy.tick(12 * 60 * 60 * 1000);
    cy.document().then((doc) =>
      doc.dispatchEvent(new Event("visibilitychange")),
    );
    cy.get("#specimen").should("have.attr", "data-phase", "day");
  });
  it("keeps the first frame grounded while the complete world refines behind it", () => {
    for (const [width, height, name] of [
      [1440, 1000, "campus"],
      [390, 844, "campus-mobile"],
    ] as const) {
      cy.viewport(width, height);
      cy.visit("/", {
        onBeforeLoad(win) {
          Cypress.sinon.stub(win.performance, "now").returns(0);
        },
      });
      cy.get("#specimen", { timeout: 30000 }).should(
        "have.attr",
        "data-details",
        "ready",
      );
      capturePoster(name, "grounded");
    }
  });
});
