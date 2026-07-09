# better-resp stack

## Follow-up summary

Live page content moved from markdown files to locale-scoped JSON. First-party source, configs, and scripts are TypeScript-only; `.js/.jsx/.mjs/.cjs` files are rejected by `npm run check:no-js`.

## Current stack

- Runtime: React 19, TypeScript, Zustand for coarse UI state, Motion for the loader, Tailwind CSS v4.
- Build: Rsbuild/Rspack/SWC and Lightning CSS through Rsbuild. Rsdoctor is installed, but the current plugin invocation holds the process open locally, so CI uses deterministic bundle metrics instead.
- 3D: the existing vanilla Three scene is lazy-loaded. R3F/Drei/postprocessing remain target-stack dependencies but are not imported by the initial shell.
- Tests: Vitest unit/data tests and Cypress specs. No Playwright.
- Package manager: npm with `package-lock.json`. `pnpm`/Corepack are unavailable in this environment.

## Dependency rules

- No visual framework, Redux, Anime.js, Rapier, MDX, markdown parser, CMS, or runtime sanitizer.
- Runtime deps are feature-owned: React shell, Zustand coarse state, Motion loader, Three/GSAP/Troika lazy legacy scene, R3F/Drei/postprocessing target visual stack.
- Dev deps are build/test/analysis only: Rsbuild, TypeScript, Tailwind, Biome, Vitest, Cypress, Vite for Cypress component bundling only, Rsdoctor, glTF tooling.
- CI follow-up dependency: Vite is explicit because Cypress component testing uses its Vite dev server; it is not the app build tool. LHCI was not added because its CLI currently pulls vulnerable transitive dependencies.

## No-JS policy

Allowed first-party source/config/script extensions are `.ts`, `.tsx`, `.d.ts`, `.json`, `.css`, `.html`, and assets. `scripts/assert-no-js.ts` ignores generated/dependency folders and fails on checked-in `.js/.jsx/.mjs/.cjs`.

## Content system

- Content editors edit JSON under `src/content/pages/<locale>/` and `src/content/site/`.
- `src/content/generated/content.schema.json` gives editor schema support.
- `src/content/schema/contentSchema.ts` validates required fields, block types, safe URLs, and asset paths.
- `src/content/contentRegistry.ts` is the only central importer for page/site JSON.
- `src/content/ContentRenderer.tsx` renders structured blocks with React escaping and no raw HTML.

Markdown was removed as a live content system to remove parsing/frontmatter code and make content validation explicit. Documentation markdown remains allowed.

## Content/i18n ownership

- Global shell labels stay in `src/shared/i18n/runtime.ts`.
- Page body, nav labels used by the scene, animation copy, socials, committee roles, and member content live in JSON.
- Unknown locales fall back to English. Unknown pages throw a clear error.

## SEO and crawler signals

- `robotic-bees` manually ports only the useful `seo-robots-content-signals` ideas: generated robots, sitemap, `llms.txt`, canonical metadata, social tags, favicon, and truthful JSON-LD.
- SEO source of truth is resolved JSON content: shared site defaults in `src/content/graph/shared.json` plus locale overlays in `src/content/site/<locale>.json` and page `meta` fields.
- `src/seo/seo.ts` is pure build/test code. It does not run in the browser shell.
- `scripts/generate-seo.ts` writes `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, and the generated SEO block in `index.html`.
- `scripts/validate-seo.ts` fails when generated files are stale or indexable pages have duplicate/missing canonical metadata.
- Production robots allow public pages and point to the sitemap. Preview robots are generated as `Disallow: /` by `buildRobots(site, "preview")`.
- Only explicitly `indexable: true` pages enter the sitemap; current localized/in-scene pages stay out until real localized route URLs exist.

## Validation commands

- `npm run check:no-js`
- `npm run validate:content`
- `npm run seo:check`
- `npm run seo:generate`
- `npm run test:unit`
- `npm run test:ci`
- `npm run build` also runs `check:no-js`, `validate:content`, and `seo:check` through `prebuild`.

## Lazy-load boundaries

- Initial shell: React, i18n, Zustand, Motion loader, CSS, JSON-free app shell.
- Heavy chunk: `src/features/legacy-three/legacy-main.ts` imports Three, GSAP, Troika, and JSON content registry.
- Content validation is test/script-only and is not imported by `App`.

## Performance budgets

- Target base shell JS: <= 180 KB gzip.
- Target CSS: <= 35 KB gzip.
- No markdown parser in browser bundle.
- Heavy visual chunk is allowed to exceed shell budget until the legacy scene is split.
- Core Web Vitals are targets only; not claimed without browser measurement.

## Security

- Content supports text, safe links, safe asset paths, and structured blocks only.
- No `dangerouslySetInnerHTML` content path.
- Unsafe protocols such as `javascript:` are rejected by validation.
- SEO metadata is generated from validated JSON. Unknown page/site SEO fields are rejected instead of flowing into head tags.
- JSON-LD is the only inline script-shaped output, and it is serialized with `<`, `>`, `&`, and Unicode line separators escaped. If a deployment adds CSP headers, hash or nonce this generated `application/ld+json` block rather than enabling broad `unsafe-inline`.
- Suggested CSP baseline: `default-src 'self'; img-src 'self' data: https:; connect-src 'self'; script-src 'self' 'sha256-<generated-jsonld-hash>'; style-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.
- Script: `security:audit`. OSV runs in GitHub Actions through the pinned OSV reusable workflow because there is no npm `osv-scanner` package.
- CI security workflow runs workflow policy checks, npm audit, OSV, Dependency Review on PRs, and CodeQL.

## CI/CD

- `.github/workflows/ci.yml`: quality gate, production build/budget gate, Cypress component job, Cypress E2E smoke job.
- `.github/workflows/security.yml`: workflow policy, dependency audit, OSV, Dependency Review, CodeQL.
- `.github/workflows/benchmarks.yml`: scheduled/manual build metrics and Lighthouse CI capture for the served home route.
- `.github/workflows/deploy.yml`: GitHub Pages deploy from a validated `dist` artifact on `main`.
- Old duplicate Firebase and extra Pages workflows were removed; the repo now has one deploy path.

GitHub Actions policy:

- Top-level permissions default to `contents: read`; deploy escalates only to `pages: write` and `id-token: write`.
- Checkout uses `persist-credentials: false` and `fetch-depth: 1`.
- Workflow concurrency cancels stale CI/security/benchmark runs; production Pages deploys queue instead of canceling.
- Actions and reusable workflows are pinned to full SHAs. `npm run check:actions-pinned` rejects mutable tags.
- The npm cache is keyed through `actions/setup-node` and `package-lock.json`. `node_modules`, pnpm stores, env files, and full workspaces are not artifacted.
- Artifacts are limited to benchmark output, Lighthouse reports, Pages dist, and Cypress screenshots/videos only on failure. Normal CI writes build stats into the job summary instead of uploading an artifact.

## Benchmarking

- `npm run benchmark:build` builds and writes `artifacts/benchmarks/build.json` plus Markdown summary.
- `npm run check:budgets` fails when base JS, CSS, or largest lazy JS gzip budgets are exceeded.
- Lighthouse runs only in `.github/workflows/benchmarks.yml` through a SHA-pinned action. It audits `/` until real pathname routing exists for the in-scene sections. The local npm lockfile does not carry LHCI because the CLI currently brings audit failures.
- See `docs/benchmark.md` for budget values, variance rules, and the benchmark log.

## Commands

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run check:no-js`
- `npm run check:workflows` (action pin policy)
- `npm run check:budgets`
- `npm run validate:content`
- `npm run test:unit`
- `npm run ci`
- `npm run benchmark:build`
- `npm run analyze`

## Known limitations

- The main visual scene is still legacy vanilla Three, not fully rewritten to R3F.
- Cypress component config is present, but no extra Vite/Rsbuild component adapter dependency was added.
- JSON content is statically imported into the lazy legacy chunk because current content size is small; split locale/page imports when content grows.
- Lighthouse CI is configured but local execution needs network access to download the pinned LHCI CLI package unless it is added to devDependencies later.
- `pnpm` is unavailable in this repo; CI intentionally uses npm with the checked-in `package-lock.json`.
