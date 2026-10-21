import { motion } from "./preferences";

const sizes = [
  [240, 600],
  [320, 640],
  [390, 844],
  [600, 800],
  [820, 1180],
  [1280, 800],
  [1920, 1080],
  [844, 390],
];
const routes = [
  "/",
  "/about/",
  "/team/",
  "/events/",
  "/projects/",
  "/sponsors/",
  "/about/constitution/",
  "/about/code-of-conduct/",
  "/team/2026/",
  "/es/",
  "/es/about/",
  "/es/events/",
];
describe("responsive content and controls", () => {
  beforeEach(() => motion("reduce"));
  after(() => motion("no-preference"));
  for (const [width, height] of sizes)
    it(`fits ${width}×${height} without horizontal overflow`, () => {
      cy.viewport(width, height);
      for (const route of routes) {
        cy.visit(route);
        cy.document().then((doc) => {
          const overflow =
            doc.documentElement.scrollWidth > width + 1
              ? [...doc.querySelectorAll("main *:not(svg *)")]
                  .filter(
                    (element) =>
                      !element.closest(".hero") &&
                      element.getBoundingClientRect().right > width + 1,
                  )
                  .slice(0, 10)
                  .map((element) => `${element.tagName}.${element.className}`)
              : [];
          expect(
            doc.documentElement.scrollWidth,
            `${route} ${overflow.join(", ")}`,
          ).to.be.lte(width + 1);
          for (const img of Array.from(doc.images))
            expect(img.getAttribute("alt"), img.src).not.to.eq(null);
          expect(doc.querySelectorAll("main h1")).to.have.length(1);
          const title = doc.querySelector("main h1")?.getBoundingClientRect();
          expect(title?.right, `${route} title`).to.be.lte(width + 1);
        });
      }
    });
});
