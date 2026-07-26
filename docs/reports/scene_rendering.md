# Scene Rendering Verdict

Scope: local `temp-main@0560a10` compared with `better-mobile` after the
readiness repair in `3bb7b08`.

## Verdict

`temp-main` does not have a safer renderer or different scene assets. Its GLB
and logo are byte-identical to `better-mobile`, and both branches originally
waited for Troika text and decorative GSAP fades before declaring the scene
usable.

`temp-main` looked correct because its environment completed that fragile
sequence quickly. Slow GitHub runners exposed the same lifecycle design plus
several real parity regressions introduced on `better-mobile`.

The rendering failure had three layers:

1. Better Mobile had lost the fixed canvas, authored model colours, original
   glow scale, and coarse-pointer hit fallback.
2. GSAP's default lag smoothing stretched the 1.5-second entrance during slow
   WebGL frames.
3. Navigation and loading were incorrectly gated on Troika worker callbacks
   and decorative fades instead of the model becoming usable.

The branch now repairs those boundaries. It does not change the camera,
section coordinates, GLB, or Three version.

## Evidence

| Check | Result | Conclusion |
| --- | --- | --- |
| GLB and logo hashes | Identical on both branches | Assets do not explain the difference |
| GLB structure | Valid, embedded 48 KiB asset; no textures, external URIs, Draco, workers, or animations | No hidden asset dependency |
| Three r177 parse | Resolves locally in about 3 ms | A Three upgrade is not justified |
| CI network log | GLB and fonts returned HTTP 200 | Not a missing-file or Pages-path failure |
| Electron vs Chrome | Both originally failed 8 of 11 navigation tests | Browser choice was not the cause |
| Software GL | No improvement | Cypress MESA workarounds were not the cause |
| `gpuAccelerateSDF = false` | Worsened the run from 10/11 to 8/11 | The Troika switch was removed |
| Diagnostic readiness | Failures stopped at `entrance`, then `content`/`backdrop` after timing changed | The stall was lifecycle timing |
| Cypress 15.18 | Navigation specs slowed from about 11 to 34 seconds across one run | Matched its known Chromium/Electron message leak; upgraded to 15.19 |

Relevant Actions runs:

- [Electron baseline](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/runs/30186043951)
- [Chrome comparison](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/runs/30186586013)
- [Readiness diagnostics](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/runs/30189036396)
- [Disproved Troika workaround](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/runs/30189647667)

## Repairs Applied

| Boundary | Repair |
| --- | --- |
| Canvas | Restored viewport-fixed sizing and stacking |
| Model | Preserved authored non-logo material colours |
| Glow | Restored the original `11.8` and `17.6` scales |
| Touch | Restored the projected coarse-pointer fallback |
| Navigation | Queues the latest click during entrance or transition |
| Scene import | Converts a rejected chunk into `sceneReady=error` |
| Entrance timing | Uses `gsap.ticker.lagSmoothing(0)` so duration follows wall-clock time |
| Troika | Starts its scale tween immediately instead of waiting on the worker callback |
| Readiness | Marks the model usable before optional text/backdrop fades |
| Loading UI | Follows `data-scene-ready`, not module-import completion |
| Tests | The existing queue test now clicks during entrance rather than after readiness |
| Test runner | Uses Cypress 15.19, which fixes the renderer-memory leak affecting long specs |

Temporary browser, software-rendering, ticker-wake, diagnostic-phase, and
Troika switches were removed after they disproved their hypotheses.

Local verification after the repair:

- 89 unit checks pass;
- the component check passes;
- production content, SEO, and build pass;
- all 15 E2E checks pass in Cypress 15.19 headless Electron;
- `npm audit` reports 0 vulnerabilities.

## Remaining Work

Keep [issue #78](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/78)
open for only these observable outcomes:

- show usable semantic content when the scene chunk or GLB fails;
- add rejected-chunk and blocked-GLB tests;
- capture one 1440×900 and one 390×844 parity screenshot.

Do not add more renderer flags or longer Cypress timeouts. The retained
readiness state is `false`, `true`, or `error`; intermediate diagnostic phases
were deleted.

## Lean Migration

1. Render localized navigation, sections, links, and member controls as static
   HTML.
2. Give the scene one input: the active section index.
3. Move social links and committee profiles to native anchors, buttons, and
   `<dialog>`.
4. Delete their raycasting, projection, audio, haptic, SVG-reaction, CSS, and
   test-bridge owners in the same change.
5. Reduce the scene to GLB, camera, lights, stars, resize, and disposal.

That migration is tracked in
[issue #79](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/79).
Do not revive the R3F rewrite as a rendering fix; it changes camera/world
coordinates and needs a separate visual-parity gate.

## Search Findings

- [GSAP ticker documentation](https://gsap.com/docs/v3/GSAP/gsap.ticker/)
  documents the default lag smoothing and disabling it with
  `lagSmoothing(0)`. This matched the `entrance` evidence.
- [Cypress issue #29521](https://github.com/cypress-io/cypress/issues/29521)
  describes Ubuntu 24 rendering failures. The software-GL A/B run did not
  improve this repository, so its workaround was not retained.
- [Cypress browser documentation](https://docs.cypress.io/app/references/launching-browsers)
  helped compare browser modes; changing browsers did not change the failure.
- [Cypress 15.19 changelog](https://docs.cypress.io/app/references/changelog#15-19-0)
  documents the Chromium/Electron renderer-memory leak fixed by the upgrade.
- [Three.js responsive rendering](https://threejs.org/manual/en/responsive.html)
  supports leaving display size to CSS and matching the drawing buffer.
