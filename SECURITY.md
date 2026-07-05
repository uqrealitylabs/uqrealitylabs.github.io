# Security Policy

## Reporting a Vulnerability

If you find a security issue, open a GitHub Security Advisory or contact the maintainers through GitHub first.
Please include enough detail to reproduce the issue, but do not share exploit code publicly before a fix is available.

## Defense in Depth

This repository uses locked installs, dependency review, OSV scanning, Scorecard, CodeQL, actionlint, zizmor, and Dependabot.
Those checks reduce risk, but they do not eliminate supply-chain compromise or unknown zero-days.

## Production Deploys

Production deploys only run from the `prod` branch into the `production` environment.
Secrets and deploy permissions stay scoped to that environment.
