import { motion } from "./preferences";

describe("constrained first visit", () => {
  afterEach(() => {
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.emulateNetworkConditions",
        params: {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        },
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setCPUThrottlingRate",
        params: { rate: 1 },
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.setCacheDisabled",
        params: { cacheDisabled: false },
      }),
    );
  });
  it("records a reproducible static-first loading sample", () => {
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.enable",
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.emulateNetworkConditions",
        params: {
          offline: false,
          latency: 150,
          downloadThroughput: 200000,
          uploadThroughput: 100000,
        },
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Emulation.setCPUThrottlingRate",
        params: { rate: 4 },
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.clearBrowserCache",
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.setCacheDisabled",
        params: { cacheDisabled: true },
      }),
    );
    const samples = { lcp: 0, cls: 0, blocking: 0 };
    const shifts: { time: number; value: number; sources: unknown[] }[] = [];
    cy.visit("/", {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, "connection", {
          configurable: true,
          value: { saveData: true, effectiveType: "3g" },
        });
        for (const type of [
          "largest-contentful-paint",
          "layout-shift",
          "longtask",
        ])
          new win.PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (type === "largest-contentful-paint")
                samples.lcp = entry.startTime;
              if (
                type === "layout-shift" &&
                !(entry as PerformanceEntry & { hadRecentInput: boolean })
                  .hadRecentInput
              ) {
                samples.cls += (
                  entry as PerformanceEntry & { value: number }
                ).value;
                shifts.push({
                  time: entry.startTime,
                  value: (entry as PerformanceEntry & { value: number }).value,
                  sources: (
                    entry as PerformanceEntry & {
                      sources: {
                        node?: Element;
                        previousRect: DOMRectReadOnly;
                        currentRect: DOMRectReadOnly;
                      }[];
                    }
                  ).sources.map(({ node, previousRect, currentRect }) => ({
                    node:
                      node?.nodeType === 3
                        ? node.parentElement?.outerHTML.slice(0, 160)
                        : node?.tagName + "." + node?.className,
                    previousRect,
                    currentRect,
                  })),
                });
              }
              if (type === "longtask")
                samples.blocking += Math.max(0, entry.duration - 50);
            }
          }).observe({ type, buffered: true });
      },
    });
    cy.get("h1").should("be.visible");
    cy.get("#specimen").should("have.attr", "data-scene", "static");
    cy.get("#poster .poster-campus")
      .should("be.visible")
      .and(($img) => {
        expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
      });
    cy.window().then(
      (win) => new Cypress.Promise((resolve) => win.setTimeout(resolve, 2000)),
    );
    cy.window().then((win) => {
      const nav = win.performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const fcp = win.performance.getEntriesByName("first-contentful-paint")[0]
        ?.startTime;
      const result = {
        method:
          "One local Chromium sample, cold cache, 150 ms network latency, 1.6 Mbps download, 4× CPU slowdown, Save-Data enabled; optional 3D stays disabled",
        ttfb: nav.responseStart - nav.requestStart,
        fcp,
        lcp: samples.lcp,
        cls: shifts
          .filter((entry) => entry.time >= fcp)
          .reduce((sum, entry) => sum + entry.value, 0),
        beforePaintShift: shifts
          .filter((entry) => entry.time < fcp)
          .reduce((sum, entry) => sum + entry.value, 0),
        shifts,
        observedBlockingTime: samples.blocking,
        note: "Visible layout shift excludes the Cypress iframe's initial re-layout before first contentful paint; that value is retained as beforePaintShift. Observed blocking time is not Lighthouse TBT; this is not field data or an INP measurement",
      };
      cy.writeFile("out/artifacts/loading.json", result).then(() => {
        expect(fcp).to.be.lessThan(1800);
        expect(samples.lcp).to.be.lessThan(2500);
        expect(result.cls).to.be.lessThan(0.1);
      });
    });
  });
  it("records default 3D startup independently of the static fallback", () => {
    motion("no-preference");
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Network.clearBrowserCache",
      }),
    );
    const longTasks: number[] = [];
    cy.visit("/", {
      onBeforeLoad(win) {
        new win.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      },
    });
    cy.get("#specimen", { timeout: 30000 }).should(
      "have.attr",
      "data-scene",
      "ready",
    );
    cy.get("#specimen", { timeout: 30000 }).should(
      "have.attr",
      "data-launch",
      "flying",
    );
    cy.window().then((win) => {
      const timing = win.performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const visible =
        win.performance.getEntriesByName("uqrl-world-visible")[0]?.startTime;
      cy.writeFile("out/artifacts/world-loading.json", {
        method:
          "One local cold-cache Chromium visit, normal connection, default 3D, no CPU throttle; excludes provider latency and real-device Safari",
        ttfb: timing.responseStart - timing.requestStart,
        fcp: win.performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime,
        firstWorldFrame: visible,
        longestObservedTask: Math.max(0, ...longTasks),
        blockingBeforeShipLaunch: longTasks.reduce(
          (sum, duration) => sum + Math.max(0, duration - 50),
          0,
        ),
        phases: win.performance
          .getEntriesByType("measure")
          .filter((entry) => entry.name.startsWith("uqrl-"))
          .map(({ name, startTime, duration }) => ({
            name,
            startTime,
            duration,
          })),
        note: "The poster and content render before the optional world; this is a lab observation, not field INP or Lighthouse TBT",
      });
      expect(visible).to.be.lessThan(15000);
    });
  });
});
