# Review log

## JSON/no-JS follow-up

Actual subagents were used.

### Frontend Mage

- Finding: JSON nav labels were inserted through `innerHTML`.
- Fix: `setupNavbar()` now creates DOM nodes and assigns `textContent`.
- Finding: ContentRenderer was not the runtime scene boundary.
- Decision: kept ContentRenderer as the safe React renderer for structured blocks and left the legacy Three scene as the visual boundary. Full scene extraction is out of scope.

### Security Researcher

- Finding: JSON nav labels could cross into raw HTML.
- Fix: replaced `innerHTML` with DOM/text nodes.
- Finding: deploy workflows ran plain build and could bypass content/no-JS checks.
- Fix: `prebuild` runs `check:no-js` and `validate:content`; existing workflows now run `npm run test:ci`.
- Finding: target-stack visual dependencies are not imported yet.
- Decision: documented as existing `better-resp` limitation; not changed in this content follow-up.

### Techstack Genius

- Finding: production HTML still included `/src/app/main.tsx`.
- Fix: removed manual script tag from `index.html`; Rsbuild injects bundles.
- Finding: large legacy scene is `@ts-nocheck`.
- Decision: documented limitation. The follow-up enforces no first-party JS files; fully typing the legacy scene belongs with the visual extraction.

### QA / Test Strategist

- Finding: content validation missed nav, animation copy, and committee role references.
- Fix: validator and tests now cover nav fields, animation copy keys, and committee references.
- Finding: ContentRenderer escaping test was weak.
- Fix: renderer tests now cover all block types and escaped malicious text.
- Finding: Cypress component specs were pure helper tests.
- Fix: replaced with an actual ContentRenderer component mount.

### Legacy Hunter

- Result: no active first-party `.js/.jsx/.mjs/.cjs` files found.
- Result: markdown/frontmatter references are docs-only or test assertions.
- Justified active use: Three example imports include package `.js` specifiers inside TS source.

### @Ponytail Ultra

- Delete-list included many broader architecture cuts. Applied the relevant cuts/fixes for this requested follow-up only:
  - removed live markdown content;
  - removed first-party JS script/config/source paths;
  - removed pure Cypress helper specs;
  - avoided adding Valibot/TS runner/schema-generator dependencies.

## Blocked local checks

- `npm run test:component` and `npm run test:e2e`: Cypress 15.18.0 installed, but the Cypress app aborts during its smoke test on this macOS sandbox.
- `npm run analyze`: Rsdoctor opened/held its report process and did not complete in non-interactive CLI mode. `analyze` now uses deterministic build metrics instead.

## CI/security/benchmark follow-up

### Frontend Mage

- Finding: PR CI had no accessibility smoke assertion.
- Fix: added a Cypress E2E smoke for keyboard focus, `aria-current`, and canvas `aria-label`.
- Finding: Cypress component tests relied on transitive Vite.
- Fix: made Vite an explicit dev-only Cypress component test harness dependency.

### Security Researcher

- Finding: workflows used mutable action tags with `pin-blocked:` comments.
- Fix: resolved and pinned full SHAs for checkout, setup-node, artifact, Pages, Dependency Review, CodeQL, Lighthouse, and OSV reusable workflow refs. `check:actions-pinned` now rejects all non-SHA refs.
- Finding: `npx --yes` OSV/LHCI scripts were not lockfile-reproducible.
- Fix: removed those paths. OSV runs through a pinned reusable workflow; Lighthouse runs through a pinned benchmark action.

### Techstack Genius

- Finding: deploy used `ci:build` and could publish while quality checks failed.
- Fix: deploy build now runs `npm run ci`.
- Finding: LHCI as a devDependency introduced audit failures.
- Fix: removed the package and kept Lighthouse in the benchmark workflow only.

### QA / Test Strategist

- Finding: `ci:browser` was not runnable because it did not start a server.
- Fix: removed the dead alias; workflows own preview startup explicitly.
- Finding: Lighthouse readiness regex was guessed.
- Fix: benchmark workflow starts preview with a curl readiness loop before running Lighthouse.

### @Ponytail Ultra

- Delete-list applied:
  - removed fake action pin exception;
  - removed dead browser/workflow aliases;
  - removed vulnerable LHCI devDependency;
  - kept benchmark docs concise and did not add actionlint/zizmor packages.

### Benchmark Quant

- Finding: bundle budget script counted only `index*.js` as base JS, missing initial vendor/runtime scripts from `dist/index.html`.
- Fix: `collect-benchmarks.ts` now parses `dist/index.html` and sums every initial script. Corrected base JS gzip is 99.1 KiB.
- Finding: benchmark docs overclaimed timing/Web Vitals tracking.
- Fix: docs now distinguish bundle metrics, CI timing targets, Lighthouse lab warnings, and field-only INP.

### Legacy Hunter

- Result: no active legacy workflow, markdown-content, first-party JS, Playwright, Bootstrap, Redux, Anime.js, or direct Rapier blockers found.
- Remaining mentions are docs-only, test extension strings, benchmark Markdown report output, or lockfile optional/transitive metadata.

## CI review trim follow-up

### Security Researcher

- Finding: manual Pages deploy could run from a non-`main` ref.
- Fix: removed `workflow_dispatch` from deploy; Pages deploy now runs only on `main` pushes.
- Finding: workflow hardening check was too broad.
- Fix: removed the false-confidence hardening parser; `check:workflows` now only enforces SHA-pinned actions.

### Benchmark Quant

- Finding: Lighthouse audited `/about` and `/rubrics`, but those pathnames do not map to in-scene sections yet.
- Fix: Lighthouse now audits `/` only; docs mark the first row as a local seed, not a CI baseline.

### @Ponytail Ultra

- Delete-list applied: removed CI build-stat artifact upload and shortened benchmark artifact retention.
- Delete-list deferred: kept OSV, Dependency Review, CodeQL, and benchmark workflow because they were explicit project gates, not local-only theater.

## robotic-bees cleanup review

Requested passes only: Legacy Hunter, Security Researcher, Benchmark Quant, and @Ponytail Ultra.

### Legacy Hunter

- Finding: the `robotic-bees` diff still carried unrelated README/docs-to-wiki churn from the temporary branch history.
- Fix: restored README, stack, benchmark, content-authoring, review-log, and layout docs from `better-resp`, then re-applied only the SEO notes that belong to this branch.
- Result: first-party `.js/.jsx/.mjs/.cjs` scan is clean. Remaining markdown/Playwright/Rapier references are docs/test names or existing lockfile metadata, not live content or new runtime code.

### Security Researcher

- Finding: `searchVerification` existed in the content schema but had no validation or renderer path.
- Fix: removed the unused field and made unknown page/site SEO metadata fail validation.
- Finding: CSP docs implied `script-src 'self'` was enough even though generated JSON-LD is inline.
- Fix: documented hash/nonce handling for the generated `application/ld+json` block instead of suggesting broad `unsafe-inline`.

### Benchmark Quant

- Finding: no new benchmark data was collected by the cleanup itself, so there is no performance-improvement claim to make.
- Fix: kept the existing benchmark seed and budgets; bundle checks remain the evidence gate.

### @Ponytail Ultra

- Delete-list applied:
  - removed stale wiki-doc churn from the branch diff;
  - removed the unused `searchVerification` schema surface;
  - kept the SEO generator/tests because they are deterministic build-time checks, not runtime bloat;
  - did not add dependencies or CI jobs.

## remaining seo-robots-content-signals forensic pass

Requested passes only: Legacy Hunter, Security Researcher, Techstack Genius, and @Ponytail Ultra.

### Legacy Hunter

- Already copied: robots content-signal policy, sitemap generation, `llms.txt`, canonical/social metadata, JSON-LD, the current small favicon SVG/ICO surface, and generated-file tests.
- Ported now: small touch/PWA/Safari icon files and static head links from `99340ff`, plus hidden JOIN/social fallback links from `efd4e7c`.
- Rejected: source-branch `app/main.js`, `app/styles.css`, `.mjs` tests, static markdown/content paths, and `static/` crawler files because current `robotic-bees` owns TS-only source, generated SEO files, and JSON content graph resolution.

### Security Researcher

- Finding: source branch's later `favicon.svg` embeds a large base64 PNG with editor metadata.
- Fix: kept the current small inline SVG and copied only PNG touch icons plus the simple Safari mask SVG.
- Finding: no new metadata injection path was needed.
- Fix: added only static `<link rel="icon">`, `apple-touch-icon`, and `mask-icon` tags.
- Finding: routes reused generic href validation, allowing external URLs to flow into canonicals/sitemaps.
- Fix: added route-path validation and same-origin SEO validation.

### Techstack Genius

- Finding: source branch SEO scripts/tests are stale Node `.mjs` and Vite-era files.
- Fix: kept current TypeScript SEO builders and Vitest coverage; added one existing SEO test matrix for the newly ported static icon surface.
- Finding: source branch route/hash sitemap ideas conflict with current canonical route policy.
- Decision: kept the content-registry-driven sitemap with only real indexable routes.

### @Ponytail Ultra

- Delete-list applied: did not import old app code, oversized favicon SVG, duplicate robots/sitemap files, README churn, or separate SEO tests.
- Remaining useful source-branch gap after review: none found beyond the static icon links/files and accessible fallback links ported here.

## final seo-robots-content-signals comparison pass

Requested passes only: Legacy Hunter, Security Researcher, Techstack Genius, and @Ponytail Ultra.

- Already copied: generated robots/content-signal policy, sitemap, `llms.txt`, canonical/social metadata, JSON-LD escaping, hidden JOIN/social fallback links, and touch/Safari icon links.
- Ported now: the small non-base64 `favicon.svg` from `99340ff`.
- Removed now: test-only `joinUsState`, `materialConfig`, and `beeLinePath` shards plus their tests; the source branch's larger material/bee/JOIN runtime pass remains rejected as old static-app interaction work, not an SEO/crawl fix.
- Tightened now: page JSON cannot own graph-owned `route`, `theme`, or `sections`; resolver ignores those fields and validation fails them if they reappear.
- Rejected: `app/main.js`, `app/styles.css`, Node `.mjs` tests, Firebase deploy workflows, source static markdown/content paths, source-tip base64 favicon SVG, duplicate static robots/sitemap files, and README/process-doc churn.
