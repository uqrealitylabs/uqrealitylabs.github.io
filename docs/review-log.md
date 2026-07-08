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

- `npm run test:component` and `npm run test:e2e`: Cypress binary is not installed in `/Users/keys/Library/Caches/Cypress/15.18.0/Cypress.app`.
- `npm run security:audit`: registry DNS blocked (`getaddrinfo ENOTFOUND registry.npmjs.org`).
- `npm run security:osv`: `npx` could not download `osv-scanner` because registry DNS is blocked.
- `npm run analyze`: Rsdoctor opened/held its report process and did not complete in non-interactive CLI mode.
