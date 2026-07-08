# Benchmark Log

## Purpose

Track bundle size, build/test time, Lighthouse lab scores, and CI health over time. Do not claim a performance improvement without a recorded run.

## Environment Rules

Every benchmark entry should record:

- date/time and timezone
- commit SHA and branch
- runner or local machine
- OS and CPU if known
- Node and npm versions
- CI or local
- cold or warm install
- command
- number of runs
- median/min/max where repeated
- notes about variance

## Current Budgets

- base shell JS gzip: <= 180 KiB
- base CSS gzip: <= 35 KiB
- largest lazy JS chunk gzip: <= 320 KiB
- no Three/R3F/GSAP/postprocessing in the base shell
- build/test time: recorded from CI job timings; not enforced locally yet
- Lighthouse warning targets: performance >= 0.90, accessibility >= 0.95, best practices >= 0.95, SEO >= 0.90
- Web Vitals targets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1. Lighthouse is lab data, not field data, and INP is field-only.

## Benchmark Table

| Date | Commit | Environment | Build | Base JS gzip | CSS gzip | Largest lazy chunk | LH Perf | LH A11y | LCP | CLS | INP/TBT | Notes |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-07-09 | 10ed771 | local macOS arm64, Node 25.9.0 | one run | 99.1 KiB | 6.1 KiB | 208.8 KiB | not run | not run | not run | not run | not run | Local `npm run check:budgets`; base JS is all initial scripts in `dist/index.html`. |

## Detailed Runs

Build stats are emitted to `artifacts/benchmarks/build.json` and `artifacts/benchmarks/build.md`.
Lighthouse reports are emitted to `artifacts/lighthouse/` by the benchmark workflow.
Rsdoctor is installed, but the current plugin invocation holds the process open locally. Until that is fixed, `npm run analyze` records deterministic bundle metrics.

## How to Run

- `npm run benchmark`
- `npm run benchmark:build`
- `npm run analyze`
- `npm run check:budgets`

## Regression Rules

- Hard fail: any `npm run check:budgets` budget violation.
- Warning: Lighthouse category below configured warning thresholds.
- Update budgets only after a deliberate optimization or an accepted product change.
- Treat one noisy CI run as a warning. Treat repeated median regression as real.
- Compare the same route matrix on the same runner class when possible.
