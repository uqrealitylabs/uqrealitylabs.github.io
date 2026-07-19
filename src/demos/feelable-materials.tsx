import type { MaterialKind } from "@uqrealitylabs/feelable-materials";
import { lazy, Suspense, useCallback, useState } from "react";
import {
  CodeExample,
  DemoErrorBoundary,
  DemoFooter,
  DemoHeader,
  FeatureGrid,
  useSystemReducedMotion,
} from "./DemoShell";
import type { FeelableQuality } from "./FeelableScene";

const FeelableScene = lazy(() => import("./FeelableScene"));

const materials: Array<{ kind: MaterialKind; label: string; detail: string }> =
  [
    { kind: "cloth", label: "Cloth", detail: "Soft crease and slow return" },
    {
      kind: "rubber",
      label: "Rubber",
      detail: "Mush, bulge, and elastic rebound",
    },
    { kind: "glass", label: "Glass", detail: "Touch smudges that fade" },
    { kind: "grass", label: "Grass", detail: "Deterministic blades that bend" },
    { kind: "mail", label: "Mail", detail: "Card-like bend under pressure" },
    {
      kind: "enamel",
      label: "Enamel",
      detail: "Tight contact highlight and gloss",
    },
  ];

const features = [
  {
    title: "Pointer-local response",
    body: "UV-aware poke state keeps the deformation centred beneath a pointer or touch, with no React state updates per frame.",
  },
  {
    title: "Six material presets",
    body: "Cloth creases, rubber squishes, glass smudges, grass bends, mail flexes, and enamel catches a highlight.",
  },
  {
    title: "R3F-ready lifecycle",
    body: "Pure model helpers and React Three Fiber components fit inside the canvas, camera, and lighting your app already owns.",
  },
  {
    title: "Deterministic detail",
    body: "Grass instance data is seeded and reusable, while reduced-motion helpers lower work and stop surface movement.",
  },
];

const example = `import { applyPoke, createPokeState, getMaterialPreset,
  releasePoke, stepPoke } from "@uqrealitylabs/feelable-materials";
import { applyFeelableMeshResponse } from
  "@uqrealitylabs/feelable-materials/react";
import type { Mesh, Vector2 } from "three";

const poke = createPokeState();
const rubber = getMaterialPreset("rubber");

export const press = (uv: Vector2) => applyPoke(poke, uv.x, uv.y, 1);
export const release = () => releasePoke(poke);

export function frame(mesh: Mesh, delta: number) {
  stepPoke(poke, rubber, delta * 1000);
  applyFeelableMeshResponse(mesh, rubber, poke);
}`;

export function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function FeelableMaterialsDemo() {
  const systemReducedMotion = useSystemReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const [material, setMaterial] = useState<MaterialKind>("rubber");
  const [pokeSignal, setPokeSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [quality, setQuality] = useState<FeelableQuality>("balanced");
  const [ready, setReady] = useState(false);
  const [webgl] = useState(canUseWebGL);
  const reducedMotion = motionOverride ?? systemReducedMotion;
  const selected =
    materials.find((item) => item.kind === material) ?? materials[0];
  const markReady = useCallback(() => setReady(true), []);

  const reset = () => {
    setMaterial("rubber");
    setQuality("balanced");
    setMotionOverride(null);
    setResetSignal((value) => value + 1);
  };

  return (
    <div className="demo-shell">
      <DemoHeader name="Feelable Materials" slug="feelable-materials" />
      <main>
        <section className="hero" aria-labelledby="feelable-title">
          <div>
            <p className="eyebrow">TACTILE SURFACES FOR REACT THREE FIBER</p>
            <h1 id="feelable-title">Feelable Materials</h1>
            <p className="hero__lede">
              Make digital materials behave like what they claim to be.
            </p>
            <p className="hero__body">
              A small pointer-local interaction model for R3F cards, logos, and
              swatches that crease, compress, smudge, bend, and rebound.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#playground">
                Touch the materials
              </a>
              <a
                className="button button--quiet"
                href="https://github.com/uqrealitylabs/feelable-materials"
              >
                View on GitHub
              </a>
            </div>
          </div>
          <aside className="hero-note" aria-label="Library scope">
            <strong>materials, actually</strong>
            <span>local interaction, not a physics engine</span>
            <span>pointer + touch + keyboard fallback</span>
          </aside>
        </section>

        <section
          className="section-block"
          id="playground"
          aria-labelledby="playground-title"
          tabIndex={-1}
        >
          <div className="section-heading">
            <p className="eyebrow">INTERACTIVE MATERIAL BENCH</p>
            <h2 id="playground-title">Press, drag, and compare.</h2>
            <p id="canvas-help">
              Pick a preset, then drag or press the surface. Keyboard users can
              run the same library poke model with the Poke selected button.
            </p>
          </div>
          <div className="bench-layout">
            <div className="canvas-panel" aria-describedby="canvas-help">
              {webgl ? (
                <DemoErrorBoundary label="Feelable Materials canvas">
                  <Suspense
                    fallback={
                      <div className="canvas-message" role="status">
                        Loading the tactile surface…
                      </div>
                    }
                  >
                    <FeelableScene
                      material={material}
                      onReady={markReady}
                      pokeSignal={pokeSignal}
                      quality={quality}
                      reducedMotion={reducedMotion}
                      resetSignal={resetSignal}
                    />
                  </Suspense>
                </DemoErrorBoundary>
              ) : (
                <div className="static-materials" role="status">
                  <strong>Interactive preview needs WebGL.</strong>
                  <p>
                    You can still explore every preset and copy the working API
                    example.
                  </p>
                  {materials.map((item) => (
                    <span key={item.kind}>
                      {item.label} — {item.detail}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="control-panel">
              <div className="panel-heading">
                <h3>Material controls</h3>
                <button type="button" className="text-button" onClick={reset}>
                  Reset
                </button>
              </div>
              <div className="material-list">
                {materials.map((item) => (
                  <button
                    type="button"
                    className={`material-choice${material === item.kind ? " is-selected" : ""}`}
                    aria-pressed={material === item.kind}
                    data-material={item.kind}
                    key={item.kind}
                    onClick={() => setMaterial(item.kind)}
                  >
                    <span>{item.label}</span>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
              <p className="selected-detail">
                Selected: <strong>{selected.label}</strong> — {selected.detail}.
              </p>
              <label className="control-field">
                <span>Grass detail</span>
                <select
                  value={quality}
                  onChange={(event) =>
                    setQuality(event.currentTarget.value as FeelableQuality)
                  }
                >
                  <option value="balanced">Balanced · 180 blades</option>
                  <option value="showcase">Showcase · 420 blades</option>
                </select>
                <small>
                  Only changes the deterministic grass instance count.
                </small>
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) =>
                    setMotionOverride(event.currentTarget.checked)
                  }
                />
                Reduce surface motion
              </label>
              <div className="hero__actions">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={!webgl || reducedMotion}
                  onClick={() => setPokeSignal((value) => value + 1)}
                >
                  Poke selected
                </button>
              </div>
              <p className="canvas-status" role="status" aria-live="polite">
                {!webgl
                  ? "Static fallback active — WebGL is unavailable."
                  : reducedMotion
                    ? "Reduced motion is active; the surface stays still."
                    : ready
                      ? `Ready — ${selected.label} responds to pointer, touch, or keyboard.`
                      : "Loading the WebGL material bench…"}
              </p>
            </div>
          </div>
        </section>

        <section
          className="section-block"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="section-heading">
            <p className="eyebrow">WHAT THE PACKAGE OWNS</p>
            <h2 id="features-title">Small model, distinct surfaces.</h2>
            <p>
              The package supplies material response; your app keeps ownership
              of the Canvas, lighting, camera, labels, and links.
            </p>
          </div>
          <FeatureGrid items={features} />
        </section>

        <section className="section-block" aria-labelledby="code-title">
          <div className="section-heading">
            <p className="eyebrow">REAL PUBLIC API</p>
            <h2 id="code-title">One poke model, one render loop.</h2>
            <p>
              The playground uses these same public helpers; fast-changing state
              stays in refs.
            </p>
          </div>
          <CodeExample code={example} filename="RubberSurface.tsx" />
        </section>

        <section
          className="section-block install-section"
          id="install"
          aria-labelledby="install-title"
        >
          <div>
            <p className="eyebrow">NPM + PEER DEPENDENCIES</p>
            <h2 id="install-title">Bring your own Canvas.</h2>
            <p>
              Requires React 19, Three.js 0.170–0.x, and React Three Fiber 9.
              The package does not create a renderer for you.
            </p>
          </div>
          <code className="install-command">
            npm install @uqrealitylabs/feelable-materials three
            @react-three/fiber
          </code>
        </section>
      </main>
      <DemoFooter name="Feelable Materials" slug="feelable-materials" />
    </div>
  );
}
