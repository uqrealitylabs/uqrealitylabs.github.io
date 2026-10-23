export function motion(value: "reduce" | "no-preference") {
  return cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setEmulatedMedia",
      params: { features: [{ name: "prefers-reduced-motion", value }] },
    }),
  );
}
