# Performance checks

`npm run check:budgets` measures the production HTML’s initial scripts, stylesheet payloads and largest optional chunk with Node gzip and Brotli
It writes `out/artifacts/build.json` and `build.md`
The limits are 20 KiB initial JS gzip, 12 KiB CSS gzip and 250 KiB for an optional chunk

The captured original build used 63.1 KiB of initial JS gzip, 7.2 KiB CSS gzip and a 218.3 KiB largest optional chunk
The static React build’s actual figures are recorded in the generated report rather than duplicated here

`npm run test:e2e` includes a constrained first visit with 150 ms latency, 1.6 Mbps download, 4× CPU slowdown and Save-Data enabled
The report is `out/artifacts/loading.json`
Targets are FCP ≤1.8 s, LCP ≤2.5 s and CLS ≤0.1
Observed long-task blocking time is recorded separately and is not claimed as Lighthouse TBT

The scheduled Lighthouse workflow audits home, About and Events on a mobile profile and saves its own reports under `out/artifacts/lighthouse/`
Field INP, production TTFB and Search Console validation need a deployed site and real users
Local measurements cannot guarantee rankings, indexing, a clean Search Console report or field Core Web Vitals

Browser checks cover separate routes, archive records, React hydration, keyboard calendar controls, search, reduced motion, optional 3D, context recovery and horizontal overflow from 240 px to 1920 px including short landscape layouts
Axe checks public pages for applicable WCAG A/AA rules
Manual assistive-technology and physical low-power-device checks remain separate from these automated results

The optional-world report is `out/artifacts/world-loading.json`
It records default 3D startup separately from the Save-Data fallback
A local cold-cache Chromium sample after staged material compilation and surface batching recorded its first world frame at 1,076 ms and a longest observed task of 85 ms
The earlier implementation sample recorded a 2,036 ms longest observed task
These are individual local observations with different implementation revisions, not an isolated causal benchmark or a Safari/device guarantee
The constrained fallback sample recorded FCP at about 0.6 s and LCP at about 2.3 s

A Deno smoke check verified Brotli delivery, decoded city data, original MIME types, a declined-compression request and 304 revalidation
The sampled Sydney district transferred as 1,369,721 compressed bytes instead of 7,004,463 uncompressed bytes before stripping build-only shoreline inputs
The live adapter returned aircraft and ferry snapshots; AIS correctly remained unavailable without a key
