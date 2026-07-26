# Better Mobile: Lean Removal Plan

Audit target: `better-mobile` after the tooling cleanup and scene-readiness
repair.

## Verdict

Do not migrate the current architecture one-for-one. The approximately
4.8k-line `@ts-nocheck` scene owns navigation, copy, layout, audio, dialogs,
localization, accessibility fallbacks, and test hooks. React wraps it with a
second imperative DOM owner.

The lean target is:

```text
content/shared.json + content/<lang>.json
                    ↓ build-time validation
              localized static SiteShell
                    └── lazy SceneBackground
```

`SiteShell` owns every usable word and control. `SceneBackground` owns only
the GLB, camera, lights, stars, resize, disposal, and an active-section input.
GitHub Pages needs generated static HTML, not an SSR server.

## Cleanup Completed

| Request | Result |
| --- | --- |
| Remove wiki, action-pin, no-JS, and layout validators | Deleted scripts, tests, config, npm aliases, and workflow callers |
| Merge split SEO tools | `tools/scripts/seo.ts` generates and checks SEO output |
| Combine content/asset tooling | `tools/scripts/assets.ts` is the single validation entry point |
| Remove asset optimizer | Deleted because no build consumed its output; this also removed the vulnerable Sharp/glTF chain |
| Simplify Actions | One verify/deploy workflow plus focused CodeQL and security workflows |
| Remove workflow duplication | Deleted benchmark, nightly, release, and duplicate deploy paths |
| Remove command duplication | Deleted duplicate format, test, CI, and build aliases |
| Fix progressive E2E slowdown | Upgraded to Cypress 15.19, which fixes its Chromium/Electron renderer-memory leak |
| Limit names | All tracked tool/workflow filenames are one word; npm aliases are at most two words |
| Fix dependency audit | Local `npm audit` reports 0 vulnerabilities |

Do not restore asset optimization merely to satisfy a command name. Add an
`optimize` mode to `assets.ts` only when the production build consumes the
result and a measured asset misses a budget.

The current Actions coverage is sufficient: clean install, typecheck, Biome,
unit coverage, dependency audit, component test, content/SEO validation,
production build, E2E against that build, failure artifacts, Pages deploy,
dependency review, weekly OSV, and CodeQL. No additional workflow is
justified.

## Ranked Removal Plan

| Rank | Remove | Smaller owner | Gate |
| ---: | --- | --- | --- |
| 1 | 3D social cards, physics, damage canvases, grass, raycasting, haptics, audio, and test globals | Native `<a>` cards with CSS hover/focus | Keyboard, touch, and link tests |
| 2 | JOIN eye/timer/pupil/dance state machine and duplicated SVG reactions | One visible CTA link | Focus, activation, reduced-motion tests |
| 3 | Committee meshes, projection, raycasting, and custom popup | Native member buttons and `<dialog>` | Focus trap, Escape, focus return |
| 4 | Troika headings/descriptions and most GSAP sequencing | Real headings, paragraphs, and CSS transitions | Desktop/mobile screenshots |
| 5 | JavaScript viewport/layout engine | CSS grid, `clamp()`, and media/container queries | No-overflow checks |
| 6 | Unused `ContentRenderer` block system and component harness | Render the supported paragraph shape directly | Build and content check |
| 7 | `scale.ts`, test-only JOIN/social helpers, production Cypress bridge, debug branches, and duplicate constants | Direct calls or nothing | Existing outcome tests |
| 8 | Tailwind used only for visually-hidden utilities | Six local CSS declarations | Keyboard fallback remains visible on focus |
| 9 | Rsdoctor and its unused report path | Nothing | Add back only with a named report consumer |
| 10 | Unreferenced assets and production source maps | Nothing | Reference scan and deployed-size check |
| 11 | React, after the static shell is proven | Generated HTML plus minimal enhancement | No-JS and locale-route tests |

Delete each old owner in the same PR that adds its replacement. Moving code
without deleting the previous path is not a migration.

## Minimal Localization Contract

Keep the loader repo-local until a second website needs it:

```text
content/
  shared.json
  en.json
  es.json
tools/content.ts
```

- `shared.json` owns stable IDs, ordering, URLs, and asset references. It has
  no translated copy or component behaviour.
- `<lang>.json` owns `lang`, `dir`, UI/accessibility labels, SEO copy, page
  copy, roles, and biographies.
- `readCatalog(directory, defaultLocale)` discovers and parses JSON, validates
  locale/`dir`, enforces identical leaf paths and types, and rejects missing
  translations.
- The site build—not the reusable loader—owns routes, URL policy, asset
  existence, metadata, canonical URLs, and static-page output.
- Return `{ locale, dir, shared, copy }`; never merge people or navigation
  arrays by index.

This intentionally puts work on the developer/build side. Missing keys,
wrong types, bad assets, and incomplete locales fail before deployment. Do
not add React context, runtime fetches, deep merging, dotted-key fallbacks,
globals, or every locale in the browser bundle.

## Ownership Boundary

| Owner | Owns | Does not own |
| --- | --- | --- |
| Catalog | Locale discovery and copy-shape parity | React, routes, SEO policy, scene behaviour |
| Build | Routes, asset checks, metadata, static HTML | Runtime translation |
| `SiteShell` | Navigation, sections, links, cards, dialog, locale | WebGL state or body-dataset coordination |
| `SceneBackground` | Decorative Three state and section input | Copy, links, audio, dialogs, localization, accessibility |

## Open Bugs

| Priority | Problem | Minimum correction |
| --- | --- | --- |
| P0 | `index.html` has an empty root and `createRoot` is CSR-only; primary content remains canvas text | Emit localized semantic HTML and progressively enhance it |
| P0 | A GLB failure sets `sceneReady=error` but does not expose useful visible page content | Keep the static shell usable without WebGL |
| P0 | Committee controls remain pointer-led and the custom dialog lacks native focus/inert behaviour | Native buttons and `<dialog>` |
| P1 | `App` hardcodes English although Spanish is bundled | Emit one static locale page per language |
| P1 | The content graph, scene tabs, and generated routes disagree | Delete phantom routes or emit real files and anchors |
| P1 | Committee translations merge arrays by index | Key people and biographies by stable ID |
| P1 | Mobile still performs expensive per-frame novelty work | Delete novelty owners; meanwhile cap DPR and skip inactive/reduced-motion work |
| P2 | Pixelify declares weight 400 while UI CSS requests 700 | Declare the variable range or use one available weight |

Rendering parity fixes already completed: fixed canvas, authored model
colours, original glow scale, coarse-pointer fallback, queued input, honest
loading state, GSAP wall-clock timing, and decoration-independent readiness.
See [scene_rendering.md](./scene_rendering.md) for evidence.

## Migration Order

1. Finish issue #78 with visible failure content, blocked-asset tests, and two
   screenshots.
2. Build the static localized shell from the current content.
3. Move social, JOIN, and committee interactions to native DOM and delete
   their scene owners.
4. Replace the current schema/registry/runtime stack with the three-file
   catalog; emit `/` and `/es/` with correct metadata.
5. Reduce the scene, then remove Troika, most GSAP, test bridges, unused
   assets/maps, Tailwind, Rsdoctor, and narrow implementation tests.

## Tracking

- [Issue #78](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/78)
  — remaining failure and visual-parity gates.
- [Issue #79](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/79)
  — static localized shell and deletion sequence.
- [PR #58](https://github.com/uqrealitylabs/uqrealitylabs.github.io/pull/58)
  — integrated cleanup and repairs.
- [PR #72](https://github.com/uqrealitylabs/uqrealitylabs.github.io/pull/72)
  — closed as superseded; retain its evidence, not its unrelated changes.
