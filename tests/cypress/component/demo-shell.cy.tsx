import { mount } from "cypress/react";
import { DemoErrorBoundary } from "../../../src/demos/DemoShell";

function BrokenDemo(): never {
  throw new Error("Expected demo test failure");
}

describe("DemoErrorBoundary", () => {
  it("keeps the showcase usable when an interactive demo fails", () => {
    mount(
      <DemoErrorBoundary label="Interactive preview">
        <BrokenDemo />
      </DemoErrorBoundary>,
    );

    cy.get('[role="alert"]').within(() => {
      cy.contains("Interactive preview could not start.").should("be.visible");
      cy.contains("button", "Refresh demo").should("be.enabled");
    });
  });
});
