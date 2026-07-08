# Content authoring

Edit page copy in `src/content/pages/<locale>/*.json`.

Edit global animation/social/committee copy in `src/content/site/<locale>.json`.

Run:

```sh
npm run validate:content
```

Allowed block types: `paragraph`, `heading`, `list`, `quote`, `link`, `image`, `cta`, `callout`, `socialGrid`, `rubricList`, `spacer`.

Links must be internal paths, `https://`, or `mailto:`. Images must use `/Assets/...`; meaningful images need `alt`.
