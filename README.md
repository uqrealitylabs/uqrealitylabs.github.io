# UQ Reality Labs

A multipage React website for UQ’s augmented and virtual reality club

```sh
npm ci
npm run setup:rust
npm run dev
npm run check
npm run build
npm run preview
npm run test:e2e
```

Use Node 24 or newer, stable Rust with rustup, and npm with the checked-in lockfile
`setup:rust` installs the WASM target and matching bindgen CLI locally under `out/tools`

Content editors start with [the content guide](docs/content-authoring.md) and edit files in `public/assets/content/` — structured data is TOML and long documents are Markdown with TOML frontmatter

React renders complete HTML at build time
TanStack Router changes the reading surface while preserving the world and an active camera session
Calendar and search hydrate separately; the optional Three scene never blocks reading or navigation

- [Architecture and deployment](docs/stack.md)
- [Ordered service rollout](docs/services.md)
- [Search and AI discovery](docs/seo.md)
- [Performance checks](docs/benchmark.md)
- [Code of Conduct](docs/CODE_OF_CONDUCT.md)
- [Constitution source](https://github.com/uqrealitylabs/constitution/tree/main)
- [Contributing](docs/CONTRIBUTING.md)

`npm run check:budgets` writes measured bundle sizes to `out/artifacts/`
`npm run report:branches` writes the local and remote branch inventory there
`SITE_TARGET=projects npm run build` creates the separate project-domain site with projects at `/` and `/<projectname>/`

Generated HTML, feeds, SEO files, icons and search data stay in `dist/` — tool JSON and check artefacts stay in `out/` — publishing remains a separate action
