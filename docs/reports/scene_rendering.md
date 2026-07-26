# Scene Rendering Comparison

Comparison: the working tree based on `better-mobile@7267a8e` against local
`temp-main@0560a10`. The scene is unchanged from `better-mobile@0c00044`;
the newer remote `temp-main` tip changes workflows, not rendering code.

## Verdict

Current `better-mobile` is still the 4,790-line legacy Three.js scene, not
the later R3F rewrite. Its calibrated camera, `SECTION_Y_STEP = 200`, and
major object coordinates still match `temp-main`.

The visible regression comes from four smaller changes:

1. the canvas lost `position: fixed`, `inset: 0`, and `z-index: 1`;
2. every non-`Body1` model material is forcibly recolored near-black;
3. both rainbow glow planes grew by about 51%;
4. loading reports module import, not asset readiness, and import rejection
   is no longer caught.

Do not change the camera or port the R3F parity patch to fix this legacy
commit. Restore those four boundaries first.

## Evidence

| Behaviour | `temp-main` | Current `better-mobile` | Effect |
| --- | --- | --- | --- |
| Camera and section coordinates | Model-sized camera; step `200` | Same | Not the regression |
| Canvas | Fixed, inset, explicit stacking | Normal-flow 100dvw × 100dvh element inside an overflow-clipped body | Sizing, stacking, and fallback-link placement can break |
| Model materials | Preserves each non-logo material color | Sets color `0x050608` | Model parts become almost black |
| Rainbow glow | Scales `11.8` and `17.6` | Scales `17.8` and `26.4` | Glow overwhelms more of the scene |
| Scene import | Failure is caught and loader is dismissed | No rejection handler | Failed chunk leaves the loader forever |
| GLB readiness | Import completes before GLB load | Same, with GLB failure only logged | Loader can hide over an incomplete scene |
| Coarse-pointer social hit | 90 px projected fallback | Exact ray hit only | Mobile cards are harder to activate |

Relevant current code:

- [`App.tsx`](../../src/app/App.tsx) hides loading when the module promise
  resolves.
- [`legacy.css`](../../src/shared/styles/legacy.css) no longer fixes the
  canvas to the viewport.
- [`legacy-main.ts`](../../src/features/legacy-three/legacy-main.ts) contains
  the material override, enlarged glow, removed touch fallback, and
  unawaited `loadSceneModel()`.

## Minimum Repair

Apply a four-change parity patch, not a file-wide revert:

1. Restore `position: fixed; inset: 0; z-index: 1` on `#canvas`.
2. Remove the non-`Body1` `material.color.set(0x050608)` override.
3. Restore glow scales `11.8` and `17.6`; measure before changing light
   decay.
4. Make the scene expose one readiness promise that resolves after the GLB,
   textures, and first section are ready, and rejects into a usable HTML
   fallback.

Restore the 90 px projected touch fallback only as a short-term parity fix.
The lean migration is native social links with normal tap targets.

Verify one 1440×900 screenshot, one 390×844 screenshot, keyboard navigation,
reduced motion, a blocked GLB request, and a rejected scene chunk. Existing
tests mainly inspect implementation state and do not prove pixel parity.

## Lean Migration

1. Keep the repaired legacy scene temporarily.
2. Render localized headings, descriptions, links, and member controls in a
   static semantic `SiteShell`.
3. Make the scene a lazy decorative background with a single section-index
   input.
4. Move social links and committee profiles to native DOM.
5. Delete the corresponding raycasting, projection, modal, audio, haptic,
   SVG-reaction, CSS, and test-bridge code.
6. Replace the remaining scene only after desktop/mobile screenshots match.

If the later R3F commit `b11156d` is revived, treat it as a separate
migration: it changes camera and world coordinates and therefore needs its
own visual-parity gate.

## Related Work

- [Issue #78](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/78)
  — tracks the four parity repairs and their rendering gates.
- [Issue #79](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/79)
  — tracks the static localized shell and decorative-scene boundary.
- [Issue #50](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/50)
  — content ownership and mobile/desktop parity.
- [Issue #56](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/56)
  — intentional loading and bundle-safe 3D.
- [PR #72](https://github.com/uqrealitylabs/uqrealitylabs.github.io/pull/72)
  — closed as superseded; it identifies the legacy/R3F migration boundary,
  but includes unrelated changes.
- [Three.js responsive rendering](https://threejs.org/manual/en/responsive.html)
  — let CSS own display size and update the drawing buffer to match.
