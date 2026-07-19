const demos = [
  ["Eyslie", "/project/eyslie/"],
  ["Feelable Materials", "/project/feelable-materials/"],
] as const;

const libraryDemoViewports = [
  ["mobile", 390, 844],
  ["tablet", 820, 1180],
  ["desktop", 1440, 900],
] as const;

const eysliePreview = '#playground .living-word > .eyslie[role="img"]';
const eyslieText = '#playground .control-panel input[type="text"]';

type PageHealth = {
  consoleErrors: string[];
  failedAssets: string[];
};

function visitDemo(
  path: string,
  reducedMotion = false,
  pendingReadiness = false,
  disableWebGL = false,
) {
  const health: PageHealth = {
    consoleErrors: [],
    failedAssets: [],
  };

  cy.intercept("GET", /\.(?:css|js|ttf|woff2?)(?:\?.*)?$/, (request) => {
    request.continue((response) => {
      if (response.statusCode >= 400) {
        health.failedAssets.push(`${response.statusCode}: ${request.url}`);
      }
      if (
        path === "/project/feelable-materials/" &&
        request.url.includes("/bundled/async/")
      ) {
        response.setDelay(350);
      }
    });
  });

  cy.visit(path, {
    onBeforeLoad(win) {
      const originalError = win.console.error.bind(win.console);
      win.console.error = (...args) => {
        health.consoleErrors.push(args.map(String).join(" "));
        originalError(...args);
      };

      if (reducedMotion) {
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
      }

      if (pendingReadiness) {
        Object.defineProperty(win, "requestAnimationFrame", {
          configurable: true,
          value: () => 1,
        });
        Object.defineProperty(win, "ResizeObserver", {
          configurable: true,
          value: class {
            observe() {}
            unobserve() {}
            disconnect() {}
          },
        });
      }

      if (disableWebGL) {
        cy.stub(win.HTMLCanvasElement.prototype, "getContext").returns(null);
      }
    },
  });

  return health;
}

function expectHealthyPage(health: PageHealth) {
  cy.then(() => {
    expect(health.failedAssets, "failed script/style/font requests").to.deep.eq(
      [],
    );
    expect(health.consoleErrors, "console errors").to.deep.eq([]);
  });
}

function expectPageShell(name: string, path: string) {
  cy.get("header, main, footer").should("have.length", 3);
  cy.get("h1").should("have.length", 1).and("contain", name);
  cy.get('meta[name="description"]')
    .should("have.attr", "content")
    .and("not.be.empty");
  cy.get('link[rel="canonical"]').should(
    "have.attr",
    "href",
    `https://uqrealitylabs.com${path}`,
  );

  for (const id of ["playground", "features", "install"]) {
    cy.get(`header a[href="#${id}"]`).click();
    cy.location("hash").should("eq", `#${id}`);
    cy.get(`#${id}`).should("be.visible");
  }
}

describe("library demos", () => {
  it("runs the real Eyslie component and its complete control state", () => {
    const health = visitDemo("/project/eyslie/");
    expectPageShell("Eyslie", "/project/eyslie/");

    cy.get(eysliePreview)
      .should("have.class", "eyslie")
      .and("have.attr", "data-ready", "true");
    cy.get("#playground").scrollIntoView();
    cy.screenshot("eyslie-playground", { capture: "viewport" });
    cy.get(eyslieText)
      .clear()
      .type("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
      .should("have.value", "ABCDEFGHIJKLMNOPQRSTUVWX")
      .clear()
      .type("LOOK UQ");
    cy.get(eysliePreview).should("have.attr", "aria-label", "LOOK UQ");
    cy.contains("label", "Mood").find("select").select("Excited");
    cy.get(eysliePreview).should("have.attr", "data-mood", "excited");

    cy.get(eyslieText).clear();
    cy.contains("Nothing to animate yet").should("be.visible");
    cy.get(".stage-status").should("contain", "Empty:");
    cy.contains("label", "Primary eye anchor")
      .find("select")
      .should("be.disabled");
    cy.get(eyslieText).type("AWAKE");
    cy.contains("label", "Site ready:").find("input").uncheck();
    cy.get(eysliePreview).should("have.attr", "data-ready", "false");
    cy.get(".stage-status").should("contain", "Paused:");
    cy.contains("label", "Site ready:").find("input").check();
    cy.get(eysliePreview).should("have.attr", "data-ready", "true");
    cy.get(".stage-status").should("contain", "Ready:");

    cy.contains("label", "Reduce motion").find("input").check();
    cy.get(eysliePreview).should("have.attr", "data-reduced-motion", "true");
    cy.contains("button", "Reset").click();
    cy.get(eyslieText).should("have.value", "HELLO UQ");
    cy.get(eysliePreview)
      .should("have.attr", "data-mood", "idleCurious")
      .and("have.attr", "data-ready", "true");
    cy.get(".stage-status").should("contain", "Ready:");
    expectHealthyPage(health);
  });

  it("explains Eyslie readiness while fonts and layout are pending", () => {
    visitDemo("/project/eyslie/", false, true);
    cy.get(eysliePreview).should("have.attr", "data-ready", "false");
    cy.get(".stage-status").should("contain", "Loading:");
  });

  it("passes the system reduced-motion preference to Eyslie", () => {
    visitDemo("/project/eyslie/", true);
    cy.get(eysliePreview)
      .should("have.attr", "data-ready", "true")
      .and("have.attr", "data-reduced-motion", "true");
    cy.get(".stage-status").should("contain", "Ready: reduced motion");
  });

  it("runs the Feelable Materials bench with keyboard-safe controls", () => {
    const health = visitDemo("/project/feelable-materials/");
    cy.get(".canvas-panel").then(($panel) => {
      if ($panel.find(".static-materials").length) {
        cy.contains("Interactive preview needs WebGL.").should("be.visible");
      } else {
        cy.contains("Loading the tactile surface…").should("be.visible");
      }
    });
    cy.get(".canvas-panel")
      .find("canvas, .static-materials")
      .should("have.length", 1);
    expectPageShell("Feelable Materials", "/project/feelable-materials/");
    cy.get(".canvas-status").should(($status) => {
      expect($status.text()).to.match(
        /^(Ready — Rubber responds|Static fallback active)/,
      );
    });
    cy.get("#playground").scrollIntoView();
    cy.screenshot("feelable-materials-playground", { capture: "viewport" });

    cy.get('[data-material="grass"]')
      .focus()
      .should("have.focus")
      .then(($button) => $button[0].click());
    cy.get('[data-material="grass"]').should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    cy.get('[data-material="rubber"]').should(
      "have.attr",
      "aria-pressed",
      "false",
    );
    cy.get(".selected-detail").should("contain", "Selected: Grass");
    cy.contains("label", "Grass detail")
      .find("select")
      .select("showcase")
      .should("have.value", "showcase");

    cy.get(".canvas-panel").then(($panel) => {
      const poke = cy.contains("button", "Poke selected");
      if ($panel.find("canvas").length) {
        poke.should("be.enabled").focus().should("have.focus");
        poke.then(($button) => $button[0].click()).should("have.focus");
      } else {
        poke.should("be.disabled");
      }
    });

    cy.contains("label", "Reduce surface motion").find("input").check();
    cy.contains("button", "Poke selected").should("be.disabled");
    cy.get(".canvas-status").should(($status) => {
      expect($status.text()).to.match(
        /^(Reduced motion is active|Static fallback active)/,
      );
    });
    cy.contains("button", "Reset")
      .focus()
      .should("have.focus")
      .then(($button) => $button[0].click());
    cy.get('[data-material="rubber"]').should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    cy.contains("label", "Grass detail")
      .find("select")
      .should("have.value", "balanced");
    cy.contains("label", "Reduce surface motion")
      .find("input")
      .should("not.be.checked");
    expectHealthyPage(health);
  });

  it("passes the system reduced-motion preference to Feelable Materials", () => {
    visitDemo("/project/feelable-materials/", true);
    cy.contains("label", "Reduce surface motion")
      .find("input")
      .should("be.checked");
    cy.contains("button", "Poke selected").should("be.disabled");
    cy.get(".canvas-status").should(($status) => {
      expect($status.text()).to.match(
        /^(Reduced motion is active|Static fallback active)/,
      );
    });
  });

  it("keeps the Feelable Materials content useful without WebGL", () => {
    const health = visitDemo(
      "/project/feelable-materials/",
      false,
      false,
      true,
    );
    cy.get(".static-materials")
      .should("be.visible")
      .find("span")
      .should("have.length", 6);
    cy.contains("Interactive preview needs WebGL.").should("be.visible");
    cy.contains("button", "Poke selected").should("be.disabled");
    cy.get(".canvas-status").should("contain", "Static fallback active");
    expectHealthyPage(health);
  });
});

describe("library demo responsiveness", () => {
  for (const [name, path] of demos) {
    for (const [viewport, width, height] of libraryDemoViewports) {
      it(`${name} has no horizontal overflow on ${viewport}`, () => {
        cy.viewport(width, height);
        cy.visit(path);
        if (path === "/project/eyslie/") {
          cy.get(eysliePreview).should("have.attr", "data-ready", "true");
        } else {
          cy.get(".canvas-panel")
            .find("canvas, .static-materials")
            .should("have.length", 1);
        }
        cy.document().should((doc) => {
          expect(doc.documentElement.scrollWidth).to.be.lte(
            doc.documentElement.clientWidth + 1,
          );
        });
        if (viewport !== "tablet") {
          cy.screenshot(
            `${name.toLowerCase().replaceAll(" ", "-")}-${viewport}`,
            { capture: "viewport" },
          );
        }
      });
    }
  }
});
