# UQ Reality Labs Website

The organization site includes two interactive library showcases:

| Library | Demo | What it demonstrates |
| --- | --- | --- |
| `@uqrealitylabs/eyslie` | <https://uqrealitylabs.com/project/eyslie/> | Accessible living text, anchored eyes, moods, pointer tracking, winks, and reduced motion |
| `@uqrealitylabs/feelable-materials` | <https://uqrealitylabs.com/project/feelable-materials/> | Pointer-local cloth, rubber, glass, grass, mail, and enamel responses in React Three Fiber |

## Development

This repository declares npm 11.12.1 in `package.json` and installs from `package-lock.json`.

```sh
npm ci
npm run dev
```

Rsbuild serves the homepage at `/` and the demos at their production paths:

- `/project/eyslie/`
- `/project/feelable-materials/`

Build and preview the same multi-page artifact with:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Run the quality gates with:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:component
CYPRESS_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

The E2E command expects the production preview server above to be running.

## Paths, font, and deployment

`tools/config/rsbuild.config.ts` owns all three entries and emits the demos to `dist/project/<slug>/`. Rsbuild's automatic asset prefix keeps scripts, styles, fonts, and lazy chunks valid from each nested HTML file without hand-built URL strings.

No licensed font named Chalk is present in the repository. Both demos use the centralized stack `"Chalk", "Chalkboard SE", "Pixelify Sans", "Comic Sans MS", cursive`; the bundled Pixelify Sans fallback is licensed under the SIL Open Font License in `public/Assets/fonts/PixelifySans/OFL.txt` and loads locally with `font-display: swap`.

`.github/workflows/deploy.yml` installs from `package-lock.json`, runs type checking, linting, formatting, tests, the production build, and nested-path Cypress checks, then uploads the single `dist` artifact with the official GitHub Pages actions. The root site and both project paths are deployed together, so one project cannot overwrite another.

The `uqrealitylabs.com` custom domain and Cloudflare DNS/TLS are managed outside this repository. This project intentionally adds no `CNAME`; the existing GitHub Pages custom-domain setting must remain pointed at `uqrealitylabs.com`. The two new URLs become public after these changes land on `main` and the Pages workflow completes.
