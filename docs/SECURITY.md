# Security Policy

## Reporting a vulnerability

Do not open a public issue for vulnerabilities or accidental credential
exposure. Use [GitHub private vulnerability reporting](https://github.com/uqrealitylabs/uqrealitylabs.github.io/security/advisories/new).

Include the affected commit or page, reproduction steps, impact, and whether
credentials, private assets, or licensed files may be exposed.

## Repository rules

- Never commit secrets, private assets, generated builds, package caches,
  Cypress recordings, or vulnerability reports.
- Validate command selectors, semantic versions, and writable output paths.
- Start subprocesses with argument arrays; never interpolate untrusted input
  into a shell command.
- Do not use `curl | sh`, `npx`, or `go run` in GitHub Actions.
- Pin third-party Actions to full commit SHAs and use least-privilege workflow
  permissions.
- Pass tokens through environment variables and never write them to logs or
  artifacts.
- Do not include secrets, private source excerpts, or vulnerability details in
  uploaded artifacts.

## Maintainer response

Maintainers should acknowledge reports, assess impact, rotate exposed
credentials when needed, and publish fixes or guidance when safe.
