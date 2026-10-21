# Website architecture

The website uses React 19, TypeScript, native HTML and CSS, and an optional Three geographic world
Rsbuild, Rspack, SWC, Lightning CSS and Biome provide the Rust-based build, transformation, minification and formatting tools

## Ownership

| Path | Responsibility |
| --- | --- |
| `public/assets/content/` | Editable TOML and Markdown source |
| `public/assets/brand/` | Authoritative logo |
| `public/assets/world/` | Sourced geographic databases, textures and attribution |
| `public/assets/people/` | Committee photographs |
| `src/content/` | Bounded parsing, validation, routes, feed and metadata |
| `src/site/` | React views, interactive islands and styles |
| `src/world/` | Geographic scene, feeds, camera and GPU ownership |
| `src/input/` | Opt-in hand and eye controls with local vision worker |
| `src/native/` | Rust terrain baking and bounded model inspection compiled to WASM |
| `tools/` | Build, browser, unit and measurement configuration |
| `dist/` | Generated site output |
| `out/` | Generated tool settings, Rust output and verification artefacts |

The original `public/favicon.ico` is unchanged
The text-free vector follows that emblem and restores the part obscured by its lettering
Eye constraints and tactile materials are implemented in this repository
Zustand vanilla owns shared scene state
Local eye constraints, tactile CSS and pointer response own the interactions they implement

## Rendering and loading

React renders every route into full HTML for direct visits and crawlers
TanStack Router reuses those same-origin HTML responses as bounded reading payloads
The reading root changes while the geographic canvas, header, footer, search and camera session keep their ownership
The calendar and search hydrate at their own boundaries, and page-specific observers and GPU awards are released on navigation
There is no client-side Markdown parser or content fetch required to read a page
The native menu, links, document text, event agenda and footer remain readable without hydration

Static generation suits a public club website whose content changes through Git
The dev server restarts when content, portraits or geographic source assets change
Rebuild after editing content — ISR, streaming SSR and a server cache would add moving parts without improving these static responses
The calendar corrects its current day and month in Brisbane time after hydration
Subscriptions use stable event IDs, explicit timezone offsets, updated timestamps, cancellations and UTF-8-safe ICS folding

The build creates 400 px and 800 px WebP portrait variants in dist; original photographs stay editable in public
The home page begins with cached desktop/mobile WebP captures of its actual Three world
The poster carries the scene before 3D loads
Wide reading pages keep the live world in an adjacent fixed plane; mobile places it above the reading surface
The optional Three world uses mapped UQ and Brisbane footprints, a mechanically unfolding power-emblem ship and an Australia-centred globe
The ship begins over the Great Court lawn, rises on integrated thrusters and turns its main ring through ninety degrees
The initial frame loads nearby campus geometry first; city geometry, surrounding houses and detailed foliage refine it afterwards
Rust bakes the terrain vertex and colour buffers into `out/tools/world/terrain.bin`, copied into the site build
The terrain file is a fixed 181 × 181 grid of little-endian float32 positions followed by RGB colours, validated before GPU allocation
Rust also bakes 513 × 513 coastline/harbour/lake masks, preserving multipolygon island holes
Browser city payloads omit the source coastline and water-relation geometry after baking
Capital labels on the globe request one city district and its elevation extract on demand, then the camera follows an exterior arc into that district
The currently retained capital is released on return or another selection
`node tools/scripts/capitals.ts` regenerates derived OSM and Mapzen extracts using the destinations in `world.toml`
These extracts and the authored landmarks are interpretations, with incomplete heights, water boundaries and architectural detail; they are not licensed photogrammetric city meshes
Geographic JSON is a sourced machine database; human website content remains TOML and Markdown
Native scrolling updates Zustand journey progress independently of optional scene readiness
Selection updates readable details immediately and interrupts any previous camera destination
Reading surfaces use distinct native scroll-driven portrait, project, sponsor and calendar treatments
Return links and native Back restore the selected destination and keyboard focus
Save-Data, 2G/3G and reduced-motion users receive static geographic covers
Scenes stop outside the viewport, in hidden tabs and at rest, cap DPR at 1.5 and backing resolution at two million pixels, recover context loss and dispose owned GPU resources and observers
Pointer-driven lighting uses one 1024 px shadow map, refreshed while the light settles
Campus idle hovering runs at 30 fps; other stationary scenes stop drawing, and camera travel follows the display frame rate
Award entrances settle within four seconds, with pointer tilt and a static reduced-motion version
Portrait textures are limited to 256×320, and terrain maps are local compressed WebP
No media autoplays and no object spins continuously

## Content and trust

Content is public — never put minutes, email lists, OAuth secrets, tokens or private event details here
Markdown disables raw HTML, validates links and local image paths, and bounds document size and nesting
Only its validated output enters the React Markdown boundary
Draft policy/lore pages remain labelled and excluded from the sitemap and search index
Approved legal text is never fabricated or automatically translated

The constitution repository’s `main` is authoritative
The site links to that source until its separate publisher creates the approved PDF release
The future CDN address is `https://cdn.uqrealitylabs.com/constitution.pdf` — don’t advertise a PDF before that route works

## Hosting and caching

The normal build serves `uqrealitylabs.com`, with projects at `/projects/` until the separate domain is available
`SITE_TARGET=projects npm run build` produces `project.uqrealitylabs.com` routes and canonicals
Its `dist/` should be deployed to its own host or virtual host, never over the main site’s output
Existing QuestRelay, Gitea and Jenkins links stay on their working hosts until the planned domains are verified

`dist/_headers` describes immutable hashed bundles, revalidated HTML/content and a five-minute calendar cache for hosts that support that format
GitHub Pages does not apply `_headers` — configure equivalent cache and security headers on the Oracle reverse proxy
Keep public HTML revalidated, give hashed bundles a year of immutable caching, and keep mutable assets on short caching
Do not cache authenticated bot or election responses in the public cache

No deployment, DNS change or data migration happens as part of a local build
The service sequence is website → Git/Gitea/Jenkins → projects/QuestRelay → bot → elections → UQCloud porting
UQCloud is the final migration, after backup restoration and rollback have been rehearsed

Editable tool settings share `tools/config/tools.toml`; Cargo keeps its required `tools/config/Cargo.toml`
`npm run tools:config` generates native tool JSON only under `out/tools/`
Executable adapters and scripts live in `tools/scripts/`
`package.json` and GitHub workflow YAML retain their ecosystem-required formats
Checks write Cypress output to `out/cypress`, coverage to `out/coverage` and reports to `out/artifacts`
Production pages and assets remain in `dist/`

Zustand vanilla owns geographic progress, exhibit/city selection, local steering and transient expression effects
The optional Three world uses WebGPU with Three’s WebGL2 fallback, TSL Earth lighting and Meshopt WASM geometry decoding
A bounded Rust glTF parser validates embedded models in a dedicated worker before Three constructs them
Rust build output, bindgen and native bindings stay under `out/`; only production WASM assets are copied into `dist/assets/wasm`
The live-feed server runs in the project-local Deno runtime with explicit read, environment and upstream network permissions
No second rendering engine or global state library is loaded for reading pages

Team presents T3, Officers and General Committee in that order
The collapsed committee timeline keeps annual rosters, events and sponsors one level below the current team
Reading pages use distinct native scroll-driven portrait, project, sponsor and calendar treatments, all disabled for reduced motion

## Air controls

Camera permission is requested only from the Enable camera action in the Air controls dialog
Both hands and face landmarks run in the same dedicated CPU/WASM worker after consent
Index pointing takes priority over approximate calibrated gaze
Pinch release selects; a vertical pinch drag scrolls and permanently cancels that click
A held two-hand heart toggles local flight, a flat palm steers and a fist brakes
Flight offsets are bounded and ease back to the route when steering ends or exceeds the boundary
Peace, thumbs, open palm, rock and wink cues trigger cooldown-limited reactions
Smile, laugh, surprise, kiss, frown, brow, squint, curious and puff cues affect the ship and playful overlays
These are expression cues, not a psychological mood assessment
Only one camera frame is in flight; the next capture waits at least 50 ms after inference
No video, landmarks or expression data are uploaded, recorded or stored
Internal navigation preserves the session
Stopping, hiding the tab, leaving the site, pressing Escape or encountering an error releases camera tracks and terminates inference
Real cameras still need person/device calibration; synthetic-camera checks do not establish tracking accuracy
A denied camera leaves ordinary touch, mouse and keyboard navigation available
The one-time invitation preference stores only whether it has been seen

Production assets also include precompressed Brotli and gzip variants
The Deno server negotiates those variants, keeps original MIME types, varies caches by Accept-Encoding and supports ETag revalidation
The normal aircraft and ferry paths were exercised against public live sources locally
Authenticated OpenSky and AIS access still require provisioned provider credentials
