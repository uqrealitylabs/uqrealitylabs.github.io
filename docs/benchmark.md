# Benchmark Log

## Purpose

Capture bundle size and Lighthouse lab artifacts so regressions have evidence. Do not claim performance or SEO improvement without a recorded run.

## Current Budgets

- base shell JS gzip: <= 180 KiB
- base CSS gzip: <= 35 KiB
- largest lazy JS chunk gzip: <= 320 KiB
- Lighthouse warning targets: performance >= 0.90, accessibility >= 0.95, best practices >= 0.95, SEO >= 0.90

## Benchmark Table

| Date | Commit | Environment | Build | Base JS gzip | CSS gzip | Largest lazy chunk | LH Perf | LH A11y | Notes |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-07-09 | 919f931 | local macOS arm64, Node 25.9.0 | `npm run test:ci` | 99.1 KiB | 6.1 KiB | 208.8 KiB | not run | not run | SEO follow-up local run; not a CI baseline. |

## How to Run

- `npm run benchmark`
- `npm run benchmark:build`
- `npm run analyze`
- `npm run check:budgets`
