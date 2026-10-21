import type { AxeResults } from "axe-core";

describe("accessible pages", () => {
  for (const route of [
    "/",
    "/about/",
    "/events/",
    "/projects/questrelay/",
    "/team/",
    "/about/code-of-conduct/",
  ])
    it(`checks ${route} with axe`, () => {
      cy.viewport(1280, 900);
      cy.visit(route);
      cy.readFile("node_modules/axe-core/axe.min.js").then((source) =>
        cy.document().then((doc) => {
          const script = doc.createElement("script");
          script.textContent = source;
          doc.head.append(script);
        }),
      );
      cy.window()
        .then((win) => {
          const axe = (
            win as unknown as {
              axe: { run(options: object): Promise<AxeResults> };
            }
          ).axe;
          return axe.run({
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
            },
          });
        })
        .then((result) => {
          const violations = result.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            nodes: nodes.map((node) => ({
              target: node.target,
              issue: node.failureSummary,
            })),
          }));
          cy.writeFile(
            `out/artifacts/accessibility${route.replaceAll("/", "_")}.json`,
            violations,
          );
          cy.then(() =>
            expect(violations, JSON.stringify(violations)).to.deep.equal([]),
          );
        });
    });
});
