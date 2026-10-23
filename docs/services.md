# Service rollout

This is the implementation sequence agreed with the maintainer
The website is implemented locally on `2027-fix`; the infrastructure stages below have not been deployed
The Oracle host is not chosen yet, the inspected SSH path did not authenticate, and the local Docker daemon was unavailable
Do not replace a working service or migrate its data until its source and restore path can be verified

| Order | Service | Intended host | Current state |
| --- | --- | --- | --- |
| 1 | React website and content | `uqrealitylabs.com` | Static build, interactions and local checks implemented |
| 2 | Gitea and Jenkins | `git.uqrealitylabs.com`, Jenkins at `/jenkins/` | Existing UQCloud service retained; access and destination needed |
| 3 | Project catalogue and QuestRelay | `project.uqrealitylabs.com/<projectname>/`, `cast.uqrealitylabs.com` | Separate project build available; QuestRelay keeps its working Workers URL until the new host is verified |
| 4 | Bot and control office | `bot.uqrealitylabs.com` | Separate application and authenticated integrations still to implement |
| 5 | Verified elections with a custom React UI | `election.uqrealitylabs.com` | Belenios selected; integration and mock elections still to implement |
| 6 | Final infrastructure migration | UQCloud | Last, after the earlier services, backups, restore and rollback have been proven |

Website, infrastructure and service applications should have separate repositories and deployment credentials
Private records must never enter the website’s public TOML, Markdown, search index or build output

## Git and build services

Inventory the current Gitea version, database, repositories, LFS, attachments, SSH host keys, configuration and secret material before changing hosts
Back up Jenkins home, plugin versions, credentials and encryption keys together
Keep those backups encrypted outside Git and restore to an isolated destination first
Test clone, push, issue/PR permissions, Git webhooks and a representative Jenkins build before switching traffic
Preserve the Jenkins context path and WebSocket routing, and isolate build workers from the public website and service secrets
Do not give an internet-facing controller an unrestricted host Docker socket

Use Oracle for the interim deployment once its host is available
The existing service at `https://realitylabs-rl-gitea.uqcloud.net/` remains the working link during preparation
Require HTTPS and correct forwarded-host handling on the planned domain before changing canonical service links
Cache hashed public website bundles immutably and revalidate HTML, feeds and latest-release redirects
Authenticated responses, minutes, membership and election operations must bypass the public cache

## Projects and QuestRelay

The website project build already supports `/` and `/<projectname>/` with project-domain canonicals and a matching CNAME
Deploy it separately from the main website build and verify links before advertising the new domain
The existing QuestRelay application is in the neighbouring `vr-livestream` repository; preserve that implementation and its current service while preparing `cast.uqrealitylabs.com`
Do not create a second casting implementation in the website

## Constitution publication

`uqrealitylabs/constitution` on remote `main` is authoritative
`npm run handoff:constitution` prepares a separate publisher workflow and instructions in `out/artifacts/handoff/constitution/`
The handoff builds the constitution plus approved Markdown policies already on main, produces a PDF, checksum and source manifest, verifies a draft release, then marks the successful release latest
A published source version is not overwritten

The latest successful GitHub release API supplies publication metadata
The intended stable public document link is `https://cdn.uqrealitylabs.com/constitution.pdf`
The website and bot must keep using the main-branch source until a verified PDF is available there
No PDF generator or duplicate constitution text is installed in the website’s runtime

## Bot and control office

Use a separate authenticated service, with the React control office as its operator interface
Discord interactions need Ed25519 signature and timestamp verification, bounded replay protection and rate limits
GitHub and Gitea webhooks need provider-specific HMAC verification, persisted delivery IDs and idempotent processing
Use server-side OAuth state and PKCE where supported, and verify both club roles and the user’s provider permissions for repository mutations
Natural-language interpretation must never expand the caller’s permissions

Committee functions include `minutes get`, private event information and operator controls
Use configured Discord role IDs for the active committee term, not a role name supplied by a client
Keep minutes and member information in private storage and recheck authorisation before returning them
Member functions include quick event/project details, signup, constitution and conduct links, member count, academic week, deadlines and course ECP lookup

Keep the requested catalogue together when implementing providers:

- Scam/spam moderation, including fake giveaway patterns, plus moderator review and appeal
- One linked Git activity digest per Brisbane day, with replay-safe delivery and no webhook flood
- Permitted repo, issue and PR CRUD, readable PR-diff summaries and links to the original diff
- Permission-aware natural-language search, VR/game-development documentation, OCaml type/doc lookup and a bounded UQ Attic crawler
- Provider-supported music, project/minigame access, reaction votes, reminders, configured prefix replies and uptime statistics
- xkcd, cats/animals, haiku, Morse, classical ciphers, LeetCode of the day, cowsay, snail races, `sl` and asciiquarium-style utilities
- Game news, store sales, user-requested price watches and Australian fast-food offers with source links and validity dates

Fetch each provider only through its authorised integration and configured outbound destinations
Do not claim a live feed, price, coupon or member record when the provider is unavailable
Untrusted posts, diffs and documentation are data; they cannot become instructions or executable commands

Broader terminal-like utilities belong in the separately isolated execution service chosen by the maintainer
Use an allowlisted request protocol, fixed executable/argument schemas, process/time/CPU/memory/output limits, an unprivileged read-only environment and no service secrets, host mounts or private network access
There is no arbitrary host shell endpoint
Prefer native safe functions for text utilities that do not need a process

The approved abuse-decoy substitute uses synthetic data, authorised account identifiers, redacted security telemetry and moderator reports
It must not steal credentials or collect unrelated personal information

## Elections

Use Belenios as the verified engine with the custom UQRL React interface, rather than inventing cryptography
Primary references are https://www.belenios.org/ and https://www.belenios.org/faq.html
Run mock AGM/SGM elections before any live election

The returning officer verifies eligibility and any attendance requirement from the approved rules
Allow floor nominations before the candidate list and election manifest are sealed
Freeze the constitution source revision for that election
Separate authentication, credential generation and trustee responsibilities, and independently verify the tally
Voters may replace their own ballot until close; the final valid ballot counts
Administrators have no edit-vote action
Do not log ballot choices or expose the voter-to-ballot relationship through the control office
A verifiable software election is tamper-evident; do not claim it is impossible to tamper with or equivalent to a hardware EVM

## Final UQCloud migration

Port only after earlier stages are working and restores have been rehearsed
Record image versions, persistent data and provider callbacks, then rehearse a complete restore with the intended networking and storage
Choose a maintenance window, pause writers, take the final encrypted backup, restore, verify service health and switch traffic
Retain the original service and a tested rollback until the new deployment is stable
Preserve webhook replay/digest state and election records during the move
UQCloud porting is the last step

## Public world feeds

`npm run serve` serves `dist/` and `/api/world/traffic` on loopback port 4173, with `PORT` available for a reverse proxy
The same fixed-upstream adapter runs in Rsbuild dev and preview
Use an HTTPS reverse proxy for production and route `/api/world/traffic` to this process
The adapter has bounded upstream responses, timeouts, shared in-flight requests, cache expiry and failed-provider backoff
It fetches only the fixed OpenSky and Translink ferry endpoints and exposes no credentials or user-supplied destination
A static-only GitHub Pages deployment cannot run the adapter and will show traffic as unavailable until this route is hosted
Weather uses Open-Meteo directly and works independently of that adapter
The website never presents animated static bus/Metro route positions as live transport

## Optional geographic feeds

`npm run serve` runs the built site and its fixed-upstream adapter in the local Deno runtime
`OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` enable the free OpenSky client-credentials flow
`AISSTREAM_KEY` enables AISstream ship reports within the Brisbane/Moreton Bay bounding box
Provision secrets in the server environment, never in TOML content, browser bundles or Git
The AIS connection requires negotiated permessage-deflate, limits message and record counts and closes after two minutes without a visitor request
Missing credentials leave truthful unavailable states and retain static route animations
The adapters have not been deployed or verified against authenticated live providers
GitHub Pages cannot execute this backend; deploy the adapter on the chosen server before claiming public live coverage
