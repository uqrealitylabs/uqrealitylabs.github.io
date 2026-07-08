# Content authoring

Edit page copy in `src/content/pages/<locale>/*.json`.

Edit global animation/social/committee/SEO copy in `src/content/site/<locale>.json`.

Run:

```sh
npm run validate:content
npm run seo:check
```

Allowed block types: `paragraph`, `heading`, `list`, `quote`, `link`, `image`, `cta`, `callout`, `socialGrid`, `rubricList`, `spacer`.

Links must be internal paths, `https://`, or `mailto:`. Images must use `/Assets/...`; meaningful images need `alt`.

Indexable pages also need `meta.indexable: true`, a safe `canonicalPath`, and non-empty title/description. Run `npm run seo:generate` after changing SEO fields.
