# Review log

## robotic-bees SEO branch integration

Source branch: `seo-robots-content-signals`.

Audited commits:

- `b65b87c seo: add robots content signals and crawler policy`
- `80a315a fix: remove small logos from keything`
- `99340ff fix: restore safari favicon and keything logo`

Integration strategy: selective manual port. The source branch targeted the old JS/static stack, so no merge or cherry-pick was used.

Ported:

- content-signal robots policy (`search=yes`, `ai-input=yes`, `ai-train=no`);
- deterministic sitemap and public crawler policy;
- `llms.txt` rights/citation policy;
- SVG favicon idea;
- social metadata and structured-data coverage;
- robots/sitemap policy tests.

Dropped:

- `app/main.js` and old scene edits;
- Vite package-script changes;
- binary icon churn;
- Safari mask icon churn;
- old static sitemap that only lived outside validation;
- markdown/JS-era test and content paths;
- runtime metadata applier, because current routing has one real static page.

Reviewer fixes:

- Frontend Mage: removed runtime head mutation from `App`.
- Security Researcher: documented CSP nonce/hash caveat for inline JSON-LD.
- Techstack Genius: added TS validation for `meta.indexable` and changed WebSite JSON-LD language to site locale.
- @Ponytail Ultra: applied deletion of runtime SEO and Safari mask icon; kept generator because SEO artifacts are validated build outputs.
- QA / Test Strategist: added focused assertions for reviewer fixes; hreflang remains deferred until real locale URLs exist.
- Benchmark Quant: no SEO score claimed without Lighthouse.
- Legacy Hunter: no live markdown content or first-party JS source/config/script files are reintroduced.
