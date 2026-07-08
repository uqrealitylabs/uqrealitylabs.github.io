describe("navigation shell", () => {
  it("loads the app shell and keeps JSON-backed nav available", () => {
    cy.visit("/");
    cy.get("nav[aria-label='Main']").should("exist");
    cy.get("#nav-links button").its("length").should("be.gte", 5);
    cy.contains("#nav-links button", "Home").should("exist");
    cy.get("#canvas").should("exist");
  });
});
