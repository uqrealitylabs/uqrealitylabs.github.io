# UQ Reality Labs Website

This repository owns the UQ Reality Labs organization site. Library demos keep
their source, build, tests, and GitHub Pages deployment in their own repositories:

| Library | Public route | Source |
| --- | --- | --- |
| Eyslie | <https://uqrealitylabs.com/project/eyslie/> | <https://github.com/uqrealitylabs/eyslie> |
| Feelable Materials | <https://uqrealitylabs.com/project/feelable-materials/> | <https://github.com/uqrealitylabs/feelable-materials> |

The external site proxy maps those `/project/<slug>/` routes to the respective
Pages deployments. This repository does not copy or rebuild either demo.

## Development

The pinned toolchain is declared in `mise.toml` and application dependencies are
installed from `package-lock.json`.

```sh
mise run setup
npm run dev
```

Build and preview the site with:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Run the complete local quality gate with:

```sh
mise run check
npm run validate -- all
npm run test:component
CYPRESS_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

The E2E command expects the production preview server above to be running.

## Deployment

`.github/workflows/deploy.yml` validates and uploads only this website's `dist`
artifact. The `uqrealitylabs.com` domain, TLS, and `/project/*` proxy routes are
managed outside this repository. This project intentionally adds no `CNAME`.

Repository documentation starts at [docs/README.md](docs/README.md).
