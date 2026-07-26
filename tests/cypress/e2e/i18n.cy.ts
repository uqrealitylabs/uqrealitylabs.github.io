describe("i18n shell metadata", () => {
  it("sets default language and direction", () => {
    cy.visit("/");
    cy.get("html").should("have.attr", "lang", "en");
    cy.get("html").should("have.attr", "dir", "ltr");
  });
});
