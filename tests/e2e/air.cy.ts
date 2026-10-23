import { motion } from "./preferences";

describe("optional camera controls", () => {
  beforeEach(() => motion("reduce"));
  it("requests no camera or model before consent and handles denied permission", () => {
    let camera: { callCount: number };
    cy.visit("/", {
      onBeforeLoad(win) {
        const request = Cypress.sinon.stub(
          win.navigator.mediaDevices,
          "getUserMedia",
        );
        camera = request;
        request.rejects(new win.DOMException("Denied", "NotAllowedError"));
      },
    });
    cy.then(() => expect(camera).not.to.have.been.called);
    cy.get(".air-trigger").click();
    cy.get("#air")
      .should("be.visible")
      .and("contain", "Nothing is recorded or uploaded");
    cy.then(() => expect(camera).not.to.have.been.called);
    cy.window().then((win) =>
      expect(
        win.performance
          .getEntriesByType("resource")
          .some((r) => /\.task$/.test(r.name)),
      ).to.equal(false),
    );
    cy.get("#air [data-start]").click();
    cy.then(() => expect(camera).to.have.been.calledOnce);
    cy.get("#air [role=status]").should("contain", "unavailable");
    cy.get("#air-session").should("not.be.visible");
    cy.get("#air [data-close]").click();
    cy.get("#air").should("not.be.visible");
  });
  for (const mode of ["stop", "hidden"]) {
    it(`runs both vision models and ends on ${mode} using a synthetic camera and releases tracks on stop`, () => {
      const warnings: string[] = [];
      let track: MediaStreamTrack;
      let stopped: ReturnType<typeof Cypress.sinon.stub>;
      cy.visit("/", {
        onBeforeLoad(win) {
          const warn = win.console.warn;
          win.console.warn = (...args) => {
            warnings.push(args.map(String).join(" "));
            warn(...args);
          };
          const canvas = win.document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          canvas.getContext("2d")!.fillRect(0, 0, 640, 480);
          const stream = canvas.captureStream(5);
          const frames = win.setInterval(
            () => canvas.getContext("2d")!.fillRect(0, 0, 640, 480),
            200,
          );
          win.addEventListener("pagehide", () => win.clearInterval(frames), {
            once: true,
          });
          track = stream.getVideoTracks()[0];
          stopped = Cypress.sinon.stub(track, "stop").callThrough();
          Cypress.sinon
            .stub(win.navigator.mediaDevices, "getUserMedia")
            .resolves(stream);
        },
      });
      cy.get(".air-trigger").click();
      cy.get("#air select").should("not.exist");
      cy.get("#air [data-start]").click();
      cy.get("#air-session [role=status]", { timeout: 20000 }).should(
        ($status) => {
          expect($status.text(), warnings.join("\n")).to.contain(
            "Point to aim",
          );
        },
      );
      cy.get("#air-session video").should("be.visible");
      cy.get(".menu").click();
      cy.get('#navigation a[href="/team/"]').click();
      cy.location("pathname").should("eq", "/team/");
      cy.get("#air-session video").should("be.visible");
      cy.then(() => expect(track.readyState).to.equal("live"));
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        expect(resources.some((r) => r.name.endsWith("/hand.task"))).to.equal(
          false,
        );
      });
      if (mode === "hidden") {
        cy.document().then((doc) => {
          Object.defineProperty(doc, "hidden", {
            value: true,
            configurable: true,
          });
          doc.dispatchEvent(new Event("visibilitychange"));
        });
      } else cy.get("#air-session [data-stop]").click();
      cy.then(() => expect(stopped).to.have.been.calledOnce);
      cy.then(() => expect(track.readyState).to.equal("ended"));
      cy.get("#air-session").should("not.be.visible");
    });
  }
});
