# UQ Reality Labs Website

Website for the University of Queensland Reality Labs society. It covers the committee, projects, events, docs, socials, and the usual join-us chaos.

[![CodeQL](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/codeql.yml/badge.svg?branch=prod)](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/codeql.yml)
[![Security](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/security.yml/badge.svg?branch=prod)](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/security.yml)
[![Deploy](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/deploy.yml/badge.svg?branch=prod)](https://github.com/uqrealitylabs/uqrealitylabs.github.io/actions/workflows/deploy.yml)

## Links

- [Code of Conduct](./docs/CODE_OF_CONDUCT.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Security](./docs/SECURITY.md)
- [License](./LICENSE)
- Constitution: add the official text here when it is published.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Format: `npm run format`
- Lint: `npm run lint`
- Test: `npm run test:unit`
- Build: `npm run build`

## Deploy

Production builds are meant to come from the `prod` branch.
The current deploy workflow publishes the static build artifact to GitHub Pages.
