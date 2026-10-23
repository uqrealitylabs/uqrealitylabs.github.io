# Editing the lab

All public content belongs in `public/assets/content/`
Use TOML for structured records and Markdown for long text, with TOML between `+++` lines
Keep stable IDs and slugs when editing existing records
Run `npm run check` and `npm run build` before publishing
The build fails on invalid content, unsafe links, missing assets and mismatched filename casing

## Club copy and links

- `en.toml` and `es.toml` hold the corresponding website copy
- `shared.toml` holds membership and community links
- `awards.toml` and `sponsors.toml` contain ordered records
- Images use lowercase `/assets/...` paths, not `/Assets/...`

Awards support `id`, `title`, `year`, `description`, optional `link`, `visual` and `order`
Visuals are `trophy`, `medal`, `plaque`, `badge` and `certificate`
Sponsors support `id`, `name`, `logo`, optional `url`, `years`, `current` and `order`
Add only real sponsors and confirmed sponsorship years

## Committee and yearly archives

Copy the structure in `committee/2026.toml` into a file for the next term
Set `year`, `title`, `published`, `current` and the `[[people]]` records
Only one published term can be current, and published years must be unique
People support `id`, `name`, `role`, `group`, `photo`, optional `linkedin` and `order`
`group` is `executive` or `general`
Keep historical photo paths and records when adding a new term
For new photos, prefer `/assets/people/<year>/` and keep earlier photographs instead of overwriting them
Unverified terms may remain `published = false`
Published term years, event years and confirmed sponsor years create archive routes automatically

The 2026 term includes the existing executive roster and Antra, Connor, Keerthana and William, using the year confirmed by the maintainer

## About documents

Edit `about/constitution.md`, `code-of-conduct.md`, `logo-lore.md`, `goals.md` and `what-is-uqrl.md`
Each file needs `title`, `slugline`, `description`, `order` and optionally `slug` and `draft`
The filename supplies the slug when omitted
Set `draft = true` when final wording is missing — drafts are explicitly labelled and not indexed
Each document has its own `/about/<slug>/` page
Body headings become H2–H6 because the page owns H1
Use real, approved wording for constitution and conduct

## Events

Create `events/<slug>.md` with metadata such as this fictional authoring example — do not publish it as a real event

```toml
+++
title = "Replace with the approved event title"
slug = "replace-with-event-slug"
id = "stable-event-id"
description = "A short, accurate event description"
startDate = "2027-03-10T18:00:00+10:00"
endDate = "2027-03-10T20:00:00+10:00"
updatedAt = "2027-02-01T00:00:00+10:00"
location = "Confirmed venue"
ctaLabel = "Event details"
ctaUrl = "https://example.com/replace-before-publishing"
image = ""
tags = ["workshop"]
featured = false
cancelled = false
draft = true
order = 0
+++
```

Write the event body after the frontmatter
Add an optional `address` containing the full confirmed street address to enable Event structured data
A venue name alone is not a street address; the page stays linkable and indexed without Event markup
Dates need an explicit timezone and the end must follow the start
Update `updatedAt` whenever calendar details change
To cancel, retain the record and ID and set `cancelled = true` — deleting it prevents subscribers receiving the cancellation
The month view, agenda, event page, archive and `/events.ics` are generated from the same records

## Projects

Create `projects/<slug>.md` using `questrelay.md` as the structural example
Required fields are `title`, `slug`, `description`, `summary`, `status` and `year`
Optional fields are `slugline`, `team`, `coverImage`, `demoUrl`, `repoUrl`, `videoUrl`, `tags`, `featured`, `order` and `draft`
Status is `idea`, `active`, `shipped` or `archived`
Links appear only when provided, videos never autoplay, and a normal link opens heavy demos on demand
Featured projects come first
Projects use `/projects/<slug>/` on the main host and `/<slug>/` on the separate project host

Geographic labels live in `public/assets/content/world.toml`
Each place has a name, longitude, latitude and kind (`city`, `regional`, `land` or `local`)
The optional `offset` moves a label vertically in CSS pixels to separate nearby cities
Mapped footprints, terrain samples and route shapes are machine data under `public/assets/world`, with provenance in its `SOURCES.md`

Committee `group` values are `t3`, `officers` and `general`, displayed in that order
Only confirmed, published years appear in the optional Team timeline
