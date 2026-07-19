import {
  LivingText,
  type LivingTextMood,
  livingTextMoods,
} from "@uqrealitylabs/eyslie";
import { useCallback, useState } from "react";
import {
  CodeExample,
  DemoErrorBoundary,
  DemoFooter,
  DemoHeader,
  FeatureGrid,
  useSystemReducedMotion,
} from "./DemoShell";

const DEFAULTS = {
  text: "HELLO UQ",
  mood: livingTextMoods.idleCurious,
  primaryEye: 4,
  secondaryEye: 6,
  idleColor: "#ff5757",
  excitedColor: "#ffd66b",
  sadColor: "#68e8ff",
  pupilColor: "#6b3f22",
} as const;

const MOODS: ReadonlyArray<readonly [LivingTextMood, string]> = [
  [livingTextMoods.idleCurious, "Idle / curious"],
  [livingTextMoods.nearStartled, "Near / startled"],
  [livingTextMoods.excited, "Excited"],
  [livingTextMoods.blush, "Blushing"],
  [livingTextMoods.celebration, "Celebrating"],
  [livingTextMoods.sadShrivel, "Sad / shrivelled"],
  [livingTextMoods.recovery, "Recovering"],
];

export function EyslieDemo() {
  const systemReducedMotion = useSystemReducedMotion();
  const [text, setText] = useState<string>(DEFAULTS.text);
  const [mood, setMood] = useState<LivingTextMood>(DEFAULTS.mood);
  const [primaryChoice, setPrimaryChoice] = useState<number>(
    DEFAULTS.primaryEye,
  );
  const [secondaryChoice, setSecondaryChoice] = useState<number>(
    DEFAULTS.secondaryEye,
  );
  const [idleColor, setIdleColor] = useState<string>(DEFAULTS.idleColor);
  const [excitedColor, setExcitedColor] = useState<string>(
    DEFAULTS.excitedColor,
  );
  const [sadColor, setSadColor] = useState<string>(DEFAULTS.sadColor);
  const [pupilColor, setPupilColor] = useState<string>(DEFAULTS.pupilColor);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const [siteReady, setSiteReady] = useState(true);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  const anchors = Array.from(text)
    .map((letter, index) => ({ index, letter }))
    .filter(({ letter }) => letter.trim());
  const primaryEye = anchors.some(({ index }) => index === primaryChoice)
    ? primaryChoice
    : anchors[0]?.index;
  const secondaryEye =
    secondaryChoice === -1
      ? undefined
      : anchors.some(
            ({ index }) => index === secondaryChoice && index !== primaryEye,
          )
        ? secondaryChoice
        : anchors.find(({ index }) => index !== primaryEye)?.index;
  const reducedMotion = motionOverride ?? systemReducedMotion;
  const status = !text
    ? "Empty: type a short word or phrase to wake the letters."
    : !siteReady
      ? "Paused: enable site readiness to measure the text and start its reactions."
      : !ready
        ? "Loading: waiting for fonts and layout before the eyes wake up."
        : reducedMotion
          ? "Ready: reduced motion keeps the expression readable and still."
          : "Ready: move your pointer around the letters and watch for an organic wink.";

  function reset() {
    setText(DEFAULTS.text);
    setMood(DEFAULTS.mood);
    setPrimaryChoice(DEFAULTS.primaryEye);
    setSecondaryChoice(DEFAULTS.secondaryEye);
    setIdleColor(DEFAULTS.idleColor);
    setExcitedColor(DEFAULTS.excitedColor);
    setSadColor(DEFAULTS.sadColor);
    setPupilColor(DEFAULTS.pupilColor);
    setMotionOverride(null);
    setSiteReady(true);
    setReady(false);
  }

  const code = `import { LivingText, livingTextMoods } from "@uqrealitylabs/eyslie";
import "@uqrealitylabs/eyslie/styles.css";

<LivingText
  text=${JSON.stringify(text)}
  mood={livingTextMoods.${mood}}
  eyeLetters={{ primary: ${primaryEye ?? "undefined"}, secondary: ${secondaryEye ?? "undefined"} }}
  idleColor="${idleColor}"
  excitedColor="${excitedColor}"
  sadColor="${sadColor}"
  pupilColor="${pupilColor}"
  reducedMotion={${reducedMotion}}
  siteReady={${siteReady}}
  ariaLabel=${JSON.stringify(text || "Living text preview")}
/>`;

  return (
    <div className="demo-shell">
      <DemoHeader name="Eyslie" slug="eyslie" />
      <main>
        <section className="hero" aria-labelledby="eyslie-title">
          <div>
            <p className="eyebrow">EXPRESSIVE TEXT FOR REACT</p>
            <h1 id="eyslie-title">Eyslie</h1>
            <p className="hero__lede">
              Give a short word a face—and a little personality.
            </p>
            <p className="hero__body">
              Eyslie turns ordinary React text into accessible living letters
              with pointer-following eyes, organic winks, moods, blush, and
              thought bubbles.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#playground">
                Wake the letters
              </a>
              <a
                className="button button--quiet"
                href="https://github.com/uqrealitylabs/eyslie"
              >
                View source
              </a>
            </div>
          </div>
          <aside className="hero-note" aria-label="Library summary">
            <span>DOM + CSS</span>
            <span>React 18–19</span>
            <span>No canvas</span>
          </aside>
        </section>

        <section
          id="playground"
          className="section-block"
          aria-labelledby="playground-title"
        >
          <div className="section-heading">
            <p className="eyebrow">LIVE PLAYGROUND</p>
            <h2 id="playground-title">Make the type look back.</h2>
            <p>
              Edit the phrase, anchor its eyes, then change its mood and
              palette. The preview below is the published component—not a
              recreation.
            </p>
          </div>
          <div className="playground-layout">
            <DemoErrorBoundary label="Living text playground">
              <div className="living-stage">
                <span className="stage-label">
                  Live output / <code>LivingText</code>
                </span>
                <div className="living-word">
                  {text ? (
                    <LivingText
                      text={text}
                      mood={mood}
                      eyeLetters={{
                        primary: primaryEye,
                        secondary: secondaryEye,
                      }}
                      idleColor={idleColor}
                      excitedColor={excitedColor}
                      sadColor={sadColor}
                      pupilColor={pupilColor}
                      reducedMotion={reducedMotion}
                      siteReady={siteReady}
                      onReady={markReady}
                      ariaLabel={text}
                    />
                  ) : (
                    <p className="empty-state">
                      Nothing to animate yet. Type a phrase in the text field to
                      begin.
                    </p>
                  )}
                </div>
                <p className="stage-status" role="status" aria-live="polite">
                  {status}
                </p>
              </div>
            </DemoErrorBoundary>

            <aside className="control-panel" aria-labelledby="controls-title">
              <div className="panel-heading">
                <h3 id="controls-title">Expression controls</h3>
                <button type="button" className="text-button" onClick={reset}>
                  Reset
                </button>
              </div>

              <label className="control-field">
                <span>
                  <span>Text</span>
                  <span>{Array.from(text).length}/24</span>
                </span>
                <input
                  type="text"
                  value={text}
                  maxLength={24}
                  aria-describedby="text-help"
                  onChange={(event) => {
                    setText(event.target.value);
                    setReady(false);
                  }}
                />
                <small id="text-help">
                  Short labels and wordmarks work best.
                </small>
              </label>

              <label className="control-field">
                <span>Mood</span>
                <select
                  value={mood}
                  onChange={(event) =>
                    setMood(event.target.value as LivingTextMood)
                  }
                >
                  {MOODS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control-field">
                <span>Primary eye anchor</span>
                <select
                  value={primaryEye ?? ""}
                  disabled={!anchors.length}
                  onChange={(event) =>
                    setPrimaryChoice(Number(event.target.value))
                  }
                >
                  {!anchors.length && (
                    <option value="">No letters available</option>
                  )}
                  {anchors.map(({ index, letter }) => (
                    <option key={`${letter}-${index}`} value={index}>
                      {letter} · position {index + 1}
                    </option>
                  ))}
                </select>
              </label>

              <label className="control-field">
                <span>Wink eye anchor</span>
                <select
                  value={secondaryEye ?? ""}
                  disabled={!anchors.length}
                  onChange={(event) =>
                    setSecondaryChoice(
                      event.target.value ? Number(event.target.value) : -1,
                    )
                  }
                >
                  <option value="">None</option>
                  {anchors
                    .filter(({ index }) => index !== primaryEye)
                    .map(({ index, letter }) => (
                      <option key={`${letter}-${index}`} value={index}>
                        {letter} · position {index + 1}
                      </option>
                    ))}
                </select>
              </label>

              <label className="control-field">
                <span>
                  <span>Base colour</span>
                  <code>{idleColor}</code>
                </span>
                <input
                  type="color"
                  value={idleColor}
                  onChange={(event) => setIdleColor(event.target.value)}
                />
              </label>

              <label className="control-field">
                <span>
                  <span>Reaction colour</span>
                  <code>{excitedColor}</code>
                </span>
                <input
                  type="color"
                  value={excitedColor}
                  onChange={(event) => setExcitedColor(event.target.value)}
                />
              </label>

              <label className="control-field">
                <span>
                  <span>Sad colour</span>
                  <code>{sadColor}</code>
                </span>
                <input
                  type="color"
                  value={sadColor}
                  onChange={(event) => setSadColor(event.target.value)}
                />
              </label>

              <label className="control-field">
                <span>
                  <span>Pupil colour</span>
                  <code>{pupilColor}</code>
                </span>
                <input
                  type="color"
                  value={pupilColor}
                  onChange={(event) => setPupilColor(event.target.value)}
                />
              </label>

              <label className="check-field">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setMotionOverride(event.target.checked)}
                />
                Reduce motion{" "}
                {motionOverride === null ? "(system setting)" : "(custom)"}
              </label>

              <label className="check-field">
                <input
                  type="checkbox"
                  checked={siteReady}
                  onChange={(event) => {
                    setSiteReady(event.target.checked);
                    setReady(false);
                  }}
                />
                Site ready: measure and react
              </label>
            </aside>
          </div>
        </section>

        <section
          id="features"
          className="section-block"
          aria-labelledby="features-title"
        >
          <div className="section-heading">
            <p className="eyebrow">WHAT IT DOES</p>
            <h2 id="features-title">Small reactions, useful primitives.</h2>
          </div>
          <FeatureGrid
            items={[
              {
                title: "Living letters",
                body: "Turns short Unicode text into animated DOM letters while preserving one stable accessible label.",
              },
              {
                title: "Reactive eyes",
                body: "Anchors an eye and eyelid to chosen characters, tracks the pointer, and schedules seeded organic winks.",
              },
              {
                title: "Seven moods",
                body: "Switches curiosity, surprise, excitement, blush, celebration, sadness, and recovery with matching bubbles.",
              },
              {
                title: "Motion-aware",
                body: "Waits for fonts and layout, cleans up its listeners and timers, and becomes still when motion is reduced.",
              },
            ]}
          />
        </section>

        <section className="section-block" aria-labelledby="usage-title">
          <div className="section-heading">
            <p className="eyebrow">CURRENT SETTINGS / VALID REACT</p>
            <h2 id="usage-title">Use the component directly.</h2>
            <p>
              The snippet follows the controls above and imports the package
              stylesheet once.
            </p>
          </div>
          <CodeExample code={code} filename="LivingWord.tsx" />
        </section>

        <section
          id="install"
          className="section-block install-section"
          aria-labelledby="install-title"
        >
          <div>
            <p className="eyebrow">INSTALL</p>
            <h2 id="install-title">One component, one stylesheet.</h2>
            <p>
              React is a peer dependency; supported versions are React 18 and
              19.
            </p>
          </div>
          <code className="install-command">
            npm install @uqrealitylabs/eyslie
          </code>
        </section>
      </main>
      <DemoFooter name="Eyslie" slug="eyslie" />
    </div>
  );
}
