describe("native home scrolling", () => {
  it("coalesces a scroll burst into one journey measurement", () => {
    let heroReads = 0;
    cy.visit("/", {
      onBeforeLoad(win) {
        const measure = win.HTMLElement.prototype.getBoundingClientRect;
        win.HTMLElement.prototype.getBoundingClientRect = function () {
          if (this.classList.contains("hero")) heroReads++;
          return measure.call(this);
        };
      },
    });
    cy.then(() => {
      heroReads = 0;
    });
    cy.window().then((win) => {
      for (let index = 0; index < 25; index++)
        win.dispatchEvent(new Event("scroll"));
      return new Cypress.Promise<void>((resolve) =>
        win.requestAnimationFrame(() => resolve()),
      );
    });
    cy.then(() => expect(heroReads).to.be.at.most(1));
  });

  it("moves immediately under ordinary wheel input", () => {
    cy.viewport(1440, 1000);
    cy.visit("/");
    cy.window().then(async (win) => {
      const started = performance.now();
      await Cypress.automation("remote:debugger:protocol", {
        command: "Input.dispatchMouseEvent",
        params: {
          type: "mouseWheel",
          x: 720,
          y: 500,
          deltaX: 0,
          deltaY: 600,
        },
      });
      await new Cypress.Promise((resolve) =>
        win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)),
      );
      expect(win.scrollY, "native scroll offset").to.be.greaterThan(400);
      expect(
        win.document.querySelector<HTMLElement>(".hero")?.dataset.chapter,
        "journey chapter",
      ).to.equal("brisbane");
      expect(performance.now() - started, "input response").to.be.lessThan(250);
    });
  });
});
