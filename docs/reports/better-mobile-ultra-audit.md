# Better Mobile: Ultra-Lean Removal Report

Snapshot: `better-mobile@586d1e4`, audited 2026-07-26.

## Decision

Do not split the current architecture into more components. Delete its duties.

```text
content/shared.json + content/<lang>.json
                    ↓ one build-time loader/check
         static HTML for / and /es/
                    └── optional SceneBackground
```

The HTML owns every word, route, link, control, card, and dialog. The scene
owns only the GLB, camera, lights, stars, resize, disposal, and at most one
active-section input. GitHub Pages needs static generation, not an SSR server.

## Measured Baseline

- `legacy-main.ts` is 4,824 `@ts-nocheck` lines and is excluded from Biome.
- Its React scaffold and global stylesheet add another 1,656 lines.
- The content/i18n slice is 26 files and about 3,079 lines; production content
  uses only `paragraph` out of 11 implemented block types.
- A production build is 17 MiB: 4.9 MiB hidden source maps and about 9.7 MiB
  copied fonts. Runtime JS is 1.05 MiB before compression; both locales ship
  although only English is reachable.
- Build, typecheck, lint, 89 unit checks, one component check, and 15 E2E checks
  pass. The green responsive check measures document overflow, not WebGL
  layout, and the i18n E2E checks English only.

## Requested Tooling Cleanup

| Request | Current result | Action |
| --- | --- | --- |
| Remove wiki, action-pin, no-JS, and layout validators | Done in `7267a8e`; files, tests, aliases, config, and callers are absent | Keep deleted. Keep workflow SHA pins and Dependabot; do not restore a validator |
| Merge SEO inputs/generate/validate | Done: `tools/scripts/seo.ts generate\|check` | Keep one file |
| Combine asset/content commands | Done: `tools/scripts/assets.ts` is the one entry point | Add one referenced-file existence pass; it currently validates content/path syntax, not asset existence |
| Keep asset optimization | No: the deleted optimizer produced output no build consumed | Add an `optimize` mode only after a measured budget fails and the build consumes its output |

## Delete Now

| Rank | Tag | Cut | Net effect / evidence |
| ---: | --- | --- | --- |
| 1 | `delete:` | Rsdoctor, hidden production source maps, 36 unused files under `public/Assets/fonts`, `disturb.jpg`, and `tpaul.png` | No consumer or source reference; about 15.0 MB disappears from the deployed 17 MiB |
| 2 | `delete:` | `ContentRenderer.tsx`, its component test/mode/support, and the unit block-render suite | No production import; removes about 190 source/test lines and the direct Vite dependency |
| 3 | `delete:` | `scale.ts`, its test, and the narrow 100% coverage gate | The helper has no production caller; coverage measures only `src/shared/lib`, not the scene/content/SEO; removes 56+ lines and `@vitest/coverage-v8` |
| 4 | `native:` | Tailwind and its Rsbuild plugin | Only two visually-hidden class strings use it; replace with one local accessibility rule and remove two dependencies |
| 5 | `delete:` | Dead scene/config surface | Remove `TEXT_MAX_WIDTH`, four unused URL constants, `applyModelTransform`, false debug branches, unused CSS tokens, duplicate config shims, and dependency-owned Eyslie tests |
| 6 | `shrink:` | Misleading responsive and implementation-detail tests | Replace the 17-line overflow-only spec and most of the 485-line navigation spec with visible-content, keyboard, locale, failure, and reduced-motion outcomes |

Keep the two Bitcount files only while Troika text exists. Move the one
Pixelify variable font out of `public` so Rsbuild emits it once rather than
copying and bundling it.

## Replace, Then Delete

The estimates below overlap; do not add subsystem totals to the umbrella scene
total.

| Rank | Old owner | Smaller owner | Delete with replacement |
| ---: | --- | --- | --- |
| 1 | Canvas/Troika navigation, copy, and responsive layout | Semantic sections, native anchors, CSS grid/clamp/container queries | Most of `legacy-main.ts`, `LegacyDomScaffold.tsx`, and `legacy.css`; Troika and both Bitcount fonts |
| 2 | 3D social cards, touch textures, grass instances, raycasts, haptics, synthesized audio, and test globals | Native `<a>` cards with CSS hover/focus | About 1,400 scene/helper lines, `feelable-materials`, social helper/tests, and implementation E2E |
| 3 | JOIN eye/timer/pupil/dance/chalk state machine | One visible CTA link | About 1,300 decorative scene/DOM/CSS lines, `eyslie`, and reaction tests |
| 4 | Committee planes, projection, raycasting, popup positioning, and custom modal | DOM member grid plus native `<dialog>` | 300+ net lines; native modal supplies Escape, inert background, and focus containment |
| 5 | Graph/registry/schema/generated-schema/runtime dictionaries | Three JSON files plus one build-time catalog helper | About 2.3–2.6k lines and roughly 20 files |
| 6 | React wrapper after static output works | Generated HTML plus the minimum scene bootstrap | `react`, `react-dom`, React plugin/types, and CSR shell code |
| 7 | Auto-condensing mobile nav and duplicate Home control | Logo-to-home plus normal section links | About 75 lines and more mobile nav width |

Do not leave old and new owners running together. Each replacement PR deletes
the corresponding canvas/React/CSS/test path.

## Minimal Localization Contract

```text
content/
  shared.json
  en.json
  es.json
tools/content.ts
```

- `shared.json` contains only invariant IDs, order, URLs, assets, and member
  identity. Replace the recursive one-URL CTA graph with `joinUrl`; remove
  duplicated role slugs, role arrays, and one-value order fields.
- `<lang>.json` contains `lang`, `dir`, all visible/ARIA/alt/SEO text, page
  copy, roles, and biographies. It is the only source of translated text.
- `loadCatalog(root, locale)` returns `{ locale, dir, shared, copy }`. It
  rejects unknown locales, missing/extra keys, wrong types, duplicate IDs,
  unsafe links, and missing referenced assets at build time.
- Join localized people to shared people by stable ID, never array position.
- Return shared and localized data separately; do not deep-merge arrays.
- Do not add React context, Zustand, runtime fetches, dotted-key lookups,
  per-key fallbacks, or every locale to one browser bundle.
- The site build owns routes, metadata, canonical URLs, asset policy, and HTML.
  The generic catalog must not know React, SEO policy, or scene behaviour.

Keep `tools/content.ts` repo-local and dependency-free. Extract that unchanged
API as a library only when a second website consumes it; one website is not a
library ecosystem.

Default to one document per locale with section anchors: `/` and `/es/`.
Delete fake `/about`, `/contact`, `/committee`, `/sponsors`, and `/rubrics`
routes unless real files are emitted for them.

## Confirmed CSR, Rendering, and Mobile Bugs

| Priority | Problem | Minimum correction |
| --- | --- | --- |
| P0 | The module starts `init().catch(...)` internally, so its import resolves and sets `__uqrlLegacySceneLoaded` even when async init failed; the catch does not set error and retry is blocked | Export/await one initialization promise, set ready/error there, return cleanup, and delete the redundant global flag |
| P0 | `index.html` has an empty root; nav/social containers are populated only by the scene | Emit usable localized HTML before loading WebGL |
| P0 | English is hardcoded while Spanish JSON ships; runtime labels, JSON, shared English labels, and hardcoded SVG copy conflict | Build one locale at a time from one locale file |
| P0 | Committee cards are pointer-only, the canvas is not focusable, and the custom modal lacks a Tab trap/inert background | Use DOM buttons and native `<dialog>` |
| P1 | Graph routes are not URLs in the built site; buttons only change scene state and `dist` contains one HTML file | Use anchors in the one-page default or emit actual static files |
| P1 | Global `overflow:hidden`, `touch-action:none`, and GSAP Observer `preventDefault` suppress native scrolling/zoom | Remove them when HTML owns navigation |
| P1 | `pointerDirty` is never read; raycasts and JOIN layout reads still run every frame | Gate pointer work on the flag until those systems are deleted |
| P1 | Mobile permits DPR 3: 390×844 renders 2.96M pixels/frame | Cap retained WebGL at DPR 2, 56% fewer pixels at that viewport |
| P1 | Reduced-motion does not stop model/section/image/social GSAP paths or SVG `animateMotion` | Delete decorative motion or make every retained path duration zero |
| P1 | Social click handling is attached to `window`, so overlay clicks can raycast through to a card | Attach to the canvas only, or delete with native links |
| P1 | Localized member bios merge by array index | Add stable member IDs before locale files can reorder |
| P2 | `<img src="">` is emitted before scene init and Pixelify declares weight 400 while the UI requests 700 | Set the logo source in HTML and declare the actual variable-font range |
| P2 | Viewport/popup geometry is clamped to 320 px, distorting narrower split/zoom views | Use the real non-zero canvas/visual viewport dimensions |

There is no current hydration bug: this app is CSR-only and dynamically imports
the DOM-heavy scene inside `useEffect`. Do not add runtime SSR. If React is
temporarily kept over generated markup, use `hydrateRoot` with the exact same
catalog; `createRoot` would discard the static DOM.

## Deletion Order

1. Remove maps, unused assets/fonts, Rsdoctor, dead helpers/tests, and redundant
   config. Make `assets.ts` check every referenced file once.
2. If migration is not immediate, fix init/error handling, DPR, pointer gating,
   reduced motion, and the window-level social click.
3. Flatten content into three JSON files and emit `/` plus `/es/` static HTML.
4. Move nav, social, JOIN, and committee controls to native DOM; delete each old
   scene/CSS/test owner in the same change.
5. Reduce the scene to decoration, then remove Troika, GSAP, Tailwind, Eyslie,
   Feelable Materials, React, obsolete fonts, and implementation tests.
6. Keep only a small outcome suite: both locale pages, keyboard/dialog,
   scene-failure fallback, reduced motion, and one mobile/desktop visual gate.

Net: about **-8,000 source/test lines, -14 direct dependencies, and -15.0 MB
of deployed output** are possible while retaining Three.js as an optional
background.
