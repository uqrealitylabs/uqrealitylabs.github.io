# Better Mobile: Ponytail Ultra Audit

Audit target: local `better-mobile` at `0c00044`.

## Verdict

The branch builds, but most of the website is a 4,790-line
`@ts-nocheck` scene acting as tab controller, renderer, audio engine,
accessibility layer, modal manager, localization consumer, and interaction
test harness. React provides a mostly imperative DOM scaffold around it.

Do not port that architecture one-for-one to R3F. The lean target is:

```text
tools/content.ts
      ↓
localized static SiteShell ── lazy decorative SceneBackground
      │
      ├── native links
      ├── native member buttons/dialog
      └── visible headings and copy
```

Use build-time static HTML, not an SSR server. A usable site must survive a
failed JavaScript chunk, GLB, texture, WebGL context, or animation.

## Completed in This Audit

- Deleted the wiki, action-pin, no-JavaScript, and repository-layout
  validators plus their config/test: **−289 lines**. Removed every
  workflow/package caller too.
- Replaced four SEO files with
  [`tools/scripts/seo.ts`](../../tools/scripts/seo.ts): **−24 lines**.
- Kept content validation in the 10-line
  [`tools/scripts/assets.ts`](../../tools/scripts/assets.ts).
- Deleted asset optimization instead of preserving an unused branch.
  `@gltf-transform/cli` was its only caller, no optimized output existed, and
  production loads `test-two.glb` directly. This intentionally supersedes
  combining validation with a dead optimizer.
- Removed **165 lockfile entries** (`624 → 459`) and the vulnerable Sharp
  chain. `npm audit` now reports **zero vulnerabilities**.

Completed first-party reduction before this report: **357 lines**.

## Ranked Removal List

1. `replace:` Reduce [`legacy-main.ts`](../../src/features/legacy-three/legacy-main.ts) from 4,790 lines to a 300–500-line decorative model/stars scene; move all usable content and controls to DOM.
2. `replace:` Collapse the 3,560-line content/i18n/SEO subsystem to `content/shared.json`, `content/en.json`, `content/es.json`, and a 60–100-line build compiler: **−2,500 to −2,900 lines**.
3. `native:` Replace social material simulation, haptics, scratch/cut canvases, grass matrices, synthesized audio, and their test bridge with five `<a>` cards: about **−1,450 runtime lines**.
4. `native:` Replace Living JOIN state, timers, pupil tracking, SVG reactions, and duplicated accessible behavior with one CTA link: about **−700 to −900 lines**.
5. `native:` Replace 3D committee hit-testing, screen projection, and the custom modal with member buttons plus `<dialog>`: about **−650 net lines**.
6. `native:` Put headings, descriptions, sponsor art, and responsive layout in HTML/CSS; remove Troika layout/image code and most GSAP sequencing: about **−700 to −1,000 lines**.
7. `delete:` Remove [`ContentRenderer.tsx`](../../src/content/ContentRenderer.tsx), its eleven speculative block types, component harness, and renderer-only tests; production never imports it and all live page bodies are paragraphs.
8. `replace:` Replace the duplicate 855-line manual validator and 514-line “generated” schema atomically with one minimal build-time validator; keep trust-boundary validation, while removing the duplicate authority and `as unknown` casts.
9. `delete:` Remove phantom page routes and the Rubrics pseudo-page unless real static files are emitted; runtime has five button tabs, no URL routing, and six declared routes.
10. `delete:` Remove `theme`, trail, material, path, music, hover, and animation fields from localization data; component behavior belongs to the owning component.
11. `native:` Replace Tailwind’s two screen-reader utility usages with local CSS, then remove Tailwind and its Rsbuild plugin: **−35 lock entries / about 14.5 MiB installed**.
12. `delete:` Remove 38 unreferenced assets: 25 Bitcount faces, Electrolize, Rubik Glitch, Train One, four Pixelify static faces/README, `disturb.jpg`, and `tpaul.png`: **−9.43 MiB**.
13. `delete:` Disable hidden production source maps until an error service consumes them: **−4.85 MiB deployed**.
14. `delete:` Remove the unused Rsdoctor branch: **−76 lock entries / about 25.6 MiB installed**.
15. `delete:` Remove the 100% coverage gate and plugin; it covers 27 lines of helpers, not the scene/content runtime: **−13 lock entries / about 5.4 MiB installed**.
16. `delete:` Remove benchmarks/collector/Lighthouse (**295 lines**), nightly (**37 lines**), and release/codename machinery (**326 lines**) unless someone consumes their output.
17. `shrink:` Replace nine clean installs and five builds on a main push with one validation job and one built artifact passed to deploy.
18. `delete:` After their owning interactions move to DOM, remove test-only scene state (`window.__uqrlSocialMaterials`), dead debug branches, `scale.ts`, implementation-detail assertions, and body datasets no longer used by CSS.

## Minimal Localization System

Start repo-local. Extract a package only when a second website uses the same
compiler; a localization library with one consumer is YAGNI.

```text
content/
  shared.json
  en.json
  es.json
tools/content.ts
```

- `shared.json`: default locale, stable URLs, asset paths, keyed people/roles,
  and ordering. No translated strings or animation behavior.
- `<lang>.json`: `dir`, SEO copy, navigation/accessibility labels, page
  titles/descriptions, role labels, and biographies. The filename supplies
  the locale.
- `tools/content.ts`: use Node’s standard library to compare every locale’s
  leaf paths/types against English, reject missing/extra keys and unsafe
  URLs/assets, merge plain objects, replace arrays, and emit one static page
  and module per locale.
- Emit English at `/` and Spanish at `/es/`, including static `lang`, `dir`,
  canonical, alternate, and sitemap entries.
- Components receive one resolved object:

```ts
const { locale, dir, content } = generatedPage;

content.nav.home;
content.pages.about.description;
```

Do not add React context, a dotted-key `t()`, runtime validation, runtime deep
merging, English fallback, locale globals, network fetches, or eager imports
of every language. Key committee members by ID; never merge translation
arrays by index.

When a second website appears, extract only parse, leaf-parity, validation,
and merge helpers. Site shape, routes, SEO policy, and component behavior
stay local.

## Component Ownership

| Owner | Keep | Delete or offload |
| --- | --- | --- |
| `SiteShell` | Locale, visible headings/copy, links, active section | WebGL state and `document.body` coordination |
| `SceneBackground` | Decorative model, lighting, stars, section index input | Navigation, localization, audio, dialogs, social URLs |
| JOIN CTA | One native link | Eye state machine, reactions, timers, duplicated fallback |
| Social links | Native `<a>` cards | Physics, haptics, scratches, grass, test globals |
| Committee | Member buttons and native `<dialog>` | Raycasting, projection, pointer-only activation |
| Content compiler | Locale parity, safe paths, static output | Scene themes, material types, camera/layout values |
| SEO build step | Escaping, emitted-page metadata, robots/sitemap | Generic metadata for routes that do not exist |

Moving a behavior without deleting its old owner is not a simplification.

## Confirmed CSR, Static, and Rendering Defects

| Priority | Defect | Minimum correction |
| --- | --- | --- |
| P0 | The dynamic scene import has no rejection handler, so a chunk failure leaves the loader forever. | Catch the import error and render a usable semantic shell. |
| P0 | The loader hides when the legacy module imports, but GLB/texture loading continues asynchronously; GLB failure only logs and never reaches a user-facing error state. | Return one scene ready/error promise and keep the semantic shell usable. |
| P0 | Current CSS removed `position: fixed; inset: 0` from the canvas. Focused screen-reader fallback links enter normal flow below a 100dvh canvas while `html, body` are clipped. | Restore fixed canvas short-term; replace hidden fallbacks with visible DOM links. |
| P0 | `index.html` has an empty root, `createRoot` is CSR-only, nav starts empty, and all primary headings/descriptions are WebGL text. | Generate semantic localized HTML, then progressively enhance it. |
| P0 | Committee members are pointer-only meshes; the canvas is not focusable, yet popup close tries to restore focus to it. | Render native member buttons/links. |
| P0 | The custom `role="dialog"` has no focus trap or inert background; global Arrow/Home/End handlers still navigate sections behind it. | Use `<dialog>.showModal()` and scope navigation handlers. |
| P0 | Better Mobile forces every non-`Body1` model material to near-black, unlike `temp-main`, while also enlarging the rainbow planes. | Remove the color override first when diagnosing a dark/missing model. |
| P1 | `App` hardcodes English while both locales are eagerly bundled; Spanish and its SEO output are unreachable. | Resolve locale at build time and ship one locale per page. |
| P1 | Visible JOIN reactions and `Profile` are hardcoded in the scaffold, while localized `animationCopy` is unused. | Source visible copy from `<lang>.json` or delete the reactions. |
| P1 | Social labels live in shared data, so Spanish receives English accessibility labels. | Move human-language labels into `<lang>.json`. |
| P1 | Six routes are declared, five buttons are rendered, Rubrics is omitted, and no history/path routing exists. | Keep one page or emit actual route files and anchors. |
| P1 | Committee translations merge people by array index, so reordering can attach a biography to the wrong person. | Key members by stable ID. |
| P1 | Reduced motion still rewrites 360/640 grass matrices every frame and runs several fixed-duration scene transitions; SVG SMIL orbs repeat indefinitely. | Delete the effects or skip their work entirely in reduced motion. |
| P1 | Pupil tracking performs layout reads and SVG writes every frame after the first pointer event; `pointerDirty` is written but never read. | Delete the novelty or gate it by active section and dirty state. |
| P1 | Social interaction now requires exact ray hits; `temp-main` had a 90px projected touch fallback. | Use native links with normal tap targets. |
| P1 | Logo and generated Home button can both receive `aria-current="page"`. | Use one set of real navigation anchors. |
| P2 | Pixelify is declared only at weight 400 while the UI requests 700, producing synthesized weight. | Declare `font-weight: 100 900` or consistently use 400. |

There is no SSR today. Do not server-render `legacy-main.ts`: it reads
`window`, `document`, canvas, media queries, and WebGL at module scope.
Prerender the shell and keep the decorative scene client-only.

## Relevant Repository Work

- [Issue #50](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/50) requires content outside components and mobile/desktop parity; the current hardcoded locale and canvas-owned content do not meet it. Its Tailwind requirement should be superseded because the dependency now serves only two utilities.
- [Issue #56](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/56) requires intentional loading and bundle-safe 3D; the loader currently reports module import rather than asset readiness.
- [Issue #24](https://github.com/uqrealitylabs/uqrealitylabs.github.io/issues/24) is too vague to validate; replace it with desktop/mobile screenshots, keyboard access, reduced motion, and scene-failure acceptance criteria.
- [PR #72](https://github.com/uqrealitylabs/uqrealitylabs.github.io/pull/72) identifies `0c00044` as the legacy baseline and `b11156d` as the R3F migration boundary. Use its scene evidence, not its unrelated tooling additions.

Three.js recommends CSS-owned canvas sizing and updating the drawing buffer
only when its display size changes:
[responsive rendering guidance](https://threejs.org/manual/en/responsive.html).

## Migration Order

1. Land the validator/optimizer deletions and script consolidation completed
   here.
2. Restore fixed-canvas behavior, remove the near-black material override,
   and make loading report real scene readiness/error.
3. Build a visible `SiteShell`; keep the current scene temporarily behind it
   as a lazy enhancement.
4. Replace social, JOIN, and committee interactions with native DOM, then
   delete their scene/CSS/test implementations and dependencies.
5. Replace the content/schema/i18n stack with the three-file compiler and
   emit `/` plus `/es/`.
6. Reduce the remaining scene to model/stars only; remove Troika and most
   GSAP.
7. Delete dead assets, maps, Rsdoctor, Tailwind, coverage, release,
   benchmarks, nightly, and duplicate CI paths.
8. Retain one compiler contract test plus desktop/mobile keyboard,
   reduced-motion, failure-fallback, and screenshot checks.

## Expected Result

- Completed: **−357 first-party lines**, **−165 lock entries**, **−1 direct
  dependency**, and **0 npm vulnerabilities**.
- Content/i18n/SEO: **−2,500 to −2,900 lines**.
- Scene: **−3,500 to −4,200 of 4,790 lines**.
- Scene CSS: **−900 to −1,100 of 1,347 lines**.
- Assets and deployed maps: **−9.43 MiB** and **−4.85 MiB**.
- Additional tooling: about **−658 lines**, **−124 lock entries**, and
  **−45.5 MiB installed**.
- Runtime: remove up to four direct dependencies after the DOM shell owns the
  interactions.

net: **roughly −7,900 to −9,200 first-party lines, −289 lock entries, and
five to nine direct dependencies possible.**
