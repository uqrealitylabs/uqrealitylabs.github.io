# better-resp stack

## SEO and robots

`robotic-bees` selectively ports the useful `seo-robots-content-signals` work into the TS/JSON architecture.

- Ported: content-signal robots policy, deterministic sitemap, `llms.txt`, SVG favicon, social metadata, and safe Organization/WebSite/WebPage JSON-LD.
- Rejected: old `app/main.js`, old hand-edited scene HTML, `.mjs` tests, Vite script changes, hand-authored static sitemap/robots, Safari mask icon churn, and binary icon churn.
- `src/seo/seo.ts` is pure build/test logic for robots, sitemap, canonical URLs, metadata, social tags, and JSON-LD.
- `scripts/generate-seo.ts` writes `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, and the generated `index.html` head block.
- `scripts/validate-seo.ts` fails when generated SEO files are stale.
- Production robots allows public crawling and advertises `ai-train=no`; preview robots disallows all.
- The sitemap indexes only JSON pages with `meta.indexable: true`. Today that is `/`; `/about` and `/rubrics` are still in-scene sections.

## Security

- No raw content HTML and no runtime SEO library.
- JSON-LD is generated from validated JSON and escaped with `serializeJsonLd`.
- SEO URLs and social images are validated in `src/content/schema/contentSchema.ts`.
- Inline JSON-LD needs a CSP nonce/hash before enforcing `script-src 'self'` in production headers.

## Commands

- `npm run seo:generate`
- `npm run seo:validate`
- `npm run seo:check`
- `npm run test:ci`
- `npm run check:budgets`

## Performance

- SEO generation/validation stays script-only and is not imported by `App`.
- Local `test:ci` budget result: base JS gzip 99.1 KiB, CSS gzip 6.1 KiB, largest lazy JS gzip 208.8 KiB.
- Lighthouse was not run locally in this follow-up, so no SEO score is claimed.
