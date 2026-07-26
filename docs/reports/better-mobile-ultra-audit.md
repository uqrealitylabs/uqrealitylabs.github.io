# Better Mobile: Ponytail Ultra Audit

Audit target: the working tree based on `better-mobile@7267a8e`.
Rendering baseline: local `temp-main@0560a10`; its newer remote tip changes
workflows, not the scene.

## Verdict

Do not migrate the current architecture one-for-one. Its 4,790-line
`@ts-nocheck` scene owns navigation, text, audio, dialogs, localization,
layout, accessibility fallbacks, and its Cypress test bridge. React only
mounts a 306-line imperative scaffold around it.

The lean target is:

```text
content/*.json → build compiler → localized static SiteShell
                                      └── lazy SceneBackground
```

`SiteShell` owns every usable word and control. `SceneBackground` owns only
the GLB, camera, lights, stars, resize, and disposal. Use build-time static
HTML on GitHub Pages, not an SSR server. The site must remain usable when
JavaScript, WebGL, the scene chunk, or the GLB fails.

## Requested Cleanup: Done

| Request | Result |
| --- | --- |
| Remove wiki, action-pin, no-JS, and layout validation | Deleted the scripts, config, tests, npm commands, and workflow callers: **−289 lines**. Full-SHA enforcement remains a GitHub repository setting, not a custom script. |
| Merge `seo-inputs`, `seo-generate`, and `seo-validate` | One [`tools/scripts/seo.ts`](../../tools/scripts/seo.ts) now generates and checks SEO output: **−24 lines**. |
| Combine content validation and asset optimization | [`tools/scripts/assets.ts`](../../tools/scripts/assets.ts) is the single 10-line content-validation command. The unused optimizer was deleted rather than merged: no optimized output was consumed, the only GLB is 48 KiB, and removing it eliminated the vulnerable Sharp chain. Add asset existence checks there; add an `optimize` subcommand only when the build consumes its output. |
| Remove workflow redundancy | Site, benchmark, nightly, and release automation collapsed into [`ci.yml`](../../.github/workflows/ci.yml) and [`security.yml`](../../.github/workflows/security.yml); the default branch’s dedicated CodeQL scan remains. CI installs and builds once, tests the exact Pages artifact, and deploys it: **−838 net lines**. |
| Fix dependency audit | Removed 165 lock entries, upgraded vulnerable PostCSS, and retained a moderate-or-higher audit gate. `npm audit` reports **0 vulnerabilities**. |

Completed reduction: **1,195 net first-party/config lines** and **165 lock
entries**.

## Ranked Deletion Plan

The estimates inside the scene are evidence for rank, not extra savings to
add to the scene total.

| Rank | Action | Cut | Minimum replacement |
| ---: | --- | --- | --- |
| 1 | `shrink:` | Reduce [`legacy-main.ts`](../../src/features/legacy-three/legacy-main.ts), 4,790 lines, to a 300–500-line decorative scene: **about −4,300 lines**. | Renderer, camera, lights, GLB, stars, resize, dispose, and one section-index input. |
| 2 | `shrink:` | Replace the **3,531-line** content/i18n/SEO/test stack with three JSON files and a 50–80-line build catalog: **about −2,600 to −2,900 lines**. | `content/shared.json`, `content/en.json`, `content/es.json`, and site-owned static-page emission. |
| 3 | `native:` | Delete about 1,578 scene lines for social physics, damage canvases, grass, raycasting, haptics, synthesized audio, and test globals. | Five ordinary `<a>` cards with CSS hover/focus; remove `@uqrealitylabs/feelable-materials` and its R3F peer. |
| 4 | `native:` | Delete the JOIN eye state machine, timers, pupil tracking, dance reactions, SVG duplication, and tests. | One visible CTA link; remove `@uqrealitylabs/eyslie`. |
| 5 | `native:` | Delete 3D committee planes, projection, raycasting, and the custom popup. | Member buttons/cards and `<dialog>.showModal()`. |
| 6 | `native:` | Delete Troika-owned titles/descriptions and most GSAP sequencing. | Real `<nav>`, `<section>`, headings, paragraphs, and CSS transitions; remove `troika-three-text` and then GSAP. |
| 7 | `native:` | Delete the 466-line JS viewport/layout engine. | CSS grid, `clamp()`, media/container queries, and one scene scale rule. |
| 8 | `delete:` | Remove [`ContentRenderer.tsx`](../../src/content/ContentRenderer.tsx), its eleven speculative block types, component harness, and renderer-only tests: **about −239 lines**. Production never imports it and live page bodies use only paragraph blocks. | Nothing; render the supported paragraph shape directly. |
| 9 | `shrink:` | Delete implementation tests with their features. Keep roughly 100 lines covering four outcomes, not 476 lines of material/pupil/dataset internals. | No-JS content, keyboard/dialog, reduced motion, and scene-failure fallback. |
| 10 | `delete:` | Remove `scale.ts` and its test (**−44 lines**), test-only JOIN/social helpers, the Cypress production bridge, fixed-false debug branches, unused constants, and duplicate npm aliases: **about −580 more lines**. | Nothing, or direct dependency calls where already-declared data is sufficient. |
| 11 | `native:` | Replace Tailwind’s two visually-hidden link usages with local CSS, then remove Tailwind and its plugin. | About six CSS declarations. |
| 12 | `delete:` | Remove Rsdoctor and the unrepresentative coverage gate. | Nothing: no report consumer exists and the gate measures only 27 helper lines. |
| 13 | `delete:` | Remove 38 unreferenced assets. | Nothing: **−9.43 MiB**. |
| 14 | `delete:` | Stop deploying source maps with no error-service consumer. | Nothing: **−4.85 MiB deployed**. |

Ranks 11–14 total **−124 lock entries, −4 direct dev dependencies, and
−45.5 MiB installed**.

Keep React and Three during migration. Question React only after the static
shell works; replacing it now would add risk without removing the dominant
scene complexity.

## Minimal Reusable Localization

Start package-shaped but repo-local. Publishing a library for one consumer is
YAGNI; extract the generic loader unchanged when a second website uses it.

```text
content/
  shared.json
  en.json
  es.json
tools/content.ts
```

- `shared.json` owns stable IDs, ordering, URLs, and asset references. It
  contains no translated copy or component/animation behavior.
- `<lang>.json` owns `dir`, UI/accessibility labels, SEO copy, page copy,
  role labels, and biographies. The filename is the locale.
- The generic `readCatalog(directory, defaultLocale)` only discovers/parses
  JSON, validates locale/`dir`, enforces identical leaf paths and types, and
  rejects duplicates or incomplete translations.
- The site build validates URLs/assets, defines routes and SEO policy, and
  emits `/index.html` plus `/es/index.html`. Those concerns do not belong in
  the reusable loader.
- Return `{ locale, dir, shared, copy }`; keep `shared` and `copy` separate.
  Key people by stable ID and never merge translation arrays by index.
- Give each generated page one locale entry. Do not add React context, a
  dotted-key `t()`, runtime fetching/validation/deep merging, per-key English
  fallback, globals, or an all-locale client bundle.

This deliberately moves failure to development/build time: a missing key,
wrong type, invalid asset, or incomplete locale fails `prebuild`; the browser
does no localization work.

## Ownership Boundary

| Owner | Owns | Must not own |
| --- | --- | --- |
| Content catalog | Locale discovery and copy-shape parity | React, routes, SEO policy, URLs, scene behavior |
| Site build | Routes, asset checks, metadata, static output | Runtime translation |
| `SiteShell` | Visible nav, sections, links, cards, dialog, locale | WebGL state or `document.body.dataset` coordination |
| `SceneBackground` | Decorative Three state and section input | Copy, links, audio, dialogs, localization, accessibility |

Moving behavior without deleting its old owner is not a simplification.

## Confirmed CSR, Static, and Rendering Bugs

See [`scene_rendering.md`](./scene_rendering.md) for the direct
`temp-main` comparison.

| Priority | Root cause | Minimum correction |
| --- | --- | --- |
| P0 | Better Mobile forces non-`Body1` GLB materials to `0x050608`, making authored white parts nearly match the background. | Delete the rewrite and preserve authored GLB materials. |
| P0 | `#canvas` lost `position: fixed`, `inset: 0`, and `z-index`; fallback links now sit below a clipped 100dvh canvas. | Restore those declarations now; replace hidden fallbacks with visible DOM controls. |
| P0 | The scene import has no rejection handler, and the loader hides before the fire-and-forget GLB request settles. GLB failure only logs. | Keep the semantic shell independent; expose one scene ready/error promise for decoration status. |
| P0 | `index.html` has an empty root and `createRoot` is CSR-only; primary content is canvas text. There is no SSR today. | Emit semantic localized HTML and progressively enhance it. Never SSR-import the browser-global scene module. |
| P0 | Committee meshes are pointer-only; the custom dialog has no focus trap/inert background, global keys remain active, and focus restores to a non-focusable canvas. | Native buttons plus `<dialog>`. |
| P1 | `App` hardcodes English while both locales are bundled; Spanish, its route, and its SEO are unreachable. | Emit one locale per static page. |
| P1 | The graph declares six routes, scene tabs declare five, and the build emits only `dist/index.html`; there is no History API routing. | Delete phantom routes or emit real files and anchors. |
| P1 | Committee translations merge arrays by index. | Key shared people and translated biographies by stable ID. |
| P1 | Clicks during section animation are dropped, and the 90 px coarse-pointer social fallback from `temp-main` was removed. | Native anchors remove both state machines; only queue clicks as a temporary parity patch. |
| P1 | Per-frame layout reads, raycasts, 360/640 grass-matrix rewrites, and DPR up to 3 run on mobile; `pointerDirty` is never read and reduced motion still does work. | Delete the novelty work; short-term gate on dirty/active state, skip it for reduced motion, and cap DPR at 2. |
| P1 | The scene reads locale once at initialization; hardcoded scaffold copy and duplicate `runtime.ts` labels can diverge from content/SEO. | Pass one build-resolved locale entry to the shell; keep copy out of the scene. |
| P2 | Pixelify declares weight 400 while UI CSS requests 700. | Declare the variable range or consistently use 400. |

The integration patch resolves the canvas, material-colour, glow-scale,
coarse-pointer, and dropped-section-input regressions. It also handles a
rejected scene import. Issue #78 remains open because GLB/texture readiness,
the semantic fallback, and screenshot verification are not complete.

## Migration Order and Gates

1. Apply the four parity repairs: fixed canvas, authored GLB colors, original
   rainbow scales, and real import/asset failure handling.
2. Render a semantic `SiteShell` from the current content. The page must work
   with the scene chunk and GLB blocked.
3. Move social, JOIN, and committee controls to native DOM; immediately
   delete their scene, CSS, test, audio, haptic, and dependency owners.
4. Replace the schema/registry/runtime stack with the three-file catalog and
   emit `/` and `/es/` with correct `lang`, `dir`, canonical, alternate, and
   sitemap entries.
5. Reduce the scene to decoration, then remove Troika, most GSAP, debug/test
   bridges, unused assets, maps, Tailwind, Rsdoctor, and the narrow coverage
   gate.
6. Gate completion with 1440×900 and 390×844 screenshots, keyboard/dialog
   use, reduced motion, rejected scene chunk, blocked GLB, and usable HTML
   before JavaScript.

## Relevant GitHub Work

- [Issue #78](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/78)
  tracks the immediate scene parity and failure-state repairs.
- [Issue #79](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/79)
  tracks the static localized shell and the deletion sequence in this report.
- [Issue #50](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/50)
  supports content outside components and mobile/desktop parity; its Tailwind
  preference is no longer justified by two utility usages.
- [Issue #56](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/56)
  supports bundle-safe 3D, intentional loading, keyboard access, and reduced
  motion.
- [Issue #24](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/24)
  was closed as a duplicate because it had no testable acceptance criteria.
- [PR #72](https://github.com/uqrealitylabs/uqrealitylabs.github.io/pull/72)
  was closed as superseded. Reuse its scene evidence, not its unrelated
  tooling.

## Expected Result

The conservative remaining target is **−7,000 to −8,500 first-party/test
lines**, **−124 lock entries**, **up to nine direct dependencies**, **−9.43
MiB unused assets**, and **−4.85 MiB deployed maps**. Do not sum the ranked
scene subcuts again; they overlap the 4,790-line scene replacement.
