const viewports = [
  ["mobile", 390, 844],
  ["tablet", 820, 1180],
  ["desktop", 1440, 900],
] as const;

describe("responsive shell", () => {
  for (const [name, width, height] of viewports) {
    it(`has no horizontal overflow on ${name}`, () => {
      cy.viewport(width, height);
      cy.visit("/");
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.lte(width + 1);
      });
    });
  }
});
