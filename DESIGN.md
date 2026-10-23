---
name: UQ Reality Labs
description: A geographic journey from UQ St Lucia through Brisbane to Australia
colors:
  canvas: "#f4f0e7"
  surface: "#e8e1d7"
  text: "#202e34"
  muted: "#46595d"
  line: "#c4cac6"
  accent: "#365f5c"
  cream: "#fff3d7"
  sandstone: "#d6c49e"
  ink: "#132330"
  control: "#152c36"
  control-text: "#f0ede2"
  control-hover: "#d9d3be"
  optical-violet: "#c7c2eb"
  optical-mint: "#e1f8ec"
typography:
  display:
    fontFamily: "Monocraft, monospace"
    fontSize: "clamp(1.85rem, 3.1vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Arcade, sans-serif"
    fontSize: "clamp(4rem, 8vw, 8.5rem)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "-0.035em"
  title:
    fontFamily: 'Bricolage, "Arial Rounded MT Bold", sans-serif'
    fontSize: "clamp(1.35rem, 2.2vw, 2.1rem)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Bricolage, Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Bricolage, Arial, Helvetica, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
rounded:
  pill: "100vmax"
  circle: "50%"
  card: "1rem"
  field: "0.7rem"
  dialog: "1.5rem"
spacing:
  gutter: "clamp(1.25rem, 5vw, 6rem)"
  section: "clamp(4rem, 7vw, 7rem)"
  action-height: "2.75rem"
components:
  button-standard:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.5rem"
  button-landscape:
    backgroundColor: "{colors.control}"
    textColor: "{colors.control-text}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.2rem"
  button-landscape-hover:
    backgroundColor: "{colors.control-hover}"
    textColor: "{colors.ink}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.5rem"
  field-search:
    rounded: "{rounded.field}"
    padding: "1rem"
    width: "100%"
  card-project:
    backgroundColor: "#dae2d9"
    rounded: "{rounded.card}"
---

# Design System: UQ Reality Labs

## Overview

**Creative North Star: "UQ St Lucia → Brisbane → Australia"**

The site uses a continuous geographic world rather than a sequence of unrelated landing-page panels, moving from recognisable campus footprints through Brisbane to Australia

Sandstone, ink and muted green establish the landscape and reading surfaces, while an imagined power-emblem spacecraft carries violet glass and mint light into the same setting

This record describes the current source, not approval of the rendered result, and carries forward the user's confirmed direction from [PRODUCT.md](PRODUCT.md)

**Key Characteristics:**

- Real geographic outlines with interpretive buildings and materials
- Cinematic camera travel and quieter covers drawn from the same world
- Monocraft wordmark and geographic labels, Pixelify Sans display type and Bricolage body text
- Pill controls, badges and pointer-responsive light and shadow
- Real text and direct links beneath optional 3D

## Colors

The interface uses warm reading neutrals and ink, with restrained green actions and local optical colour in the 3D scene

### Primary

- **Muted green** (`accent`) identifies actions and emphasis on light reading surfaces

### Secondary

- **Optical violet** belongs to the transmissive lens and its nearby illumination
- **Optical mint** belongs to pale luminous material and local bounce light

### Neutral

- **Canvas** and **surface** separate the main reading plane from inset content
- **Text**, **muted** and **line** establish readable hierarchy and fine divisions
- **Ink** grounds the header, footer, full-screen navigation and reading-cover scrims
- **Control**, **control text** and **control hover** distinguish landscape pills from the scene
- **Cream** and **sandstone** supply warm text, selection and material accents

**The Local Light Rule.** Keep violet and mint attached to the optical object and its illumination rather than recolouring every interface control

## Typography

**Display fonts:** Monocraft Bold for the home wordmark and compact geographic labels, with Pixelify Sans loaded as `Arcade` for place headings and reading titles

**Body font:** Bricolage, with Arial, Helvetica and sans-serif fallbacks

Display type follows the user’s arcade and Minecraft direction, while Bricolage preserves readable prose in documents and practical club information

- **Display:** The frontmatter display role describes the home title, with journey headings using a closely related fluid size
- **Headline:** The frontmatter headline role describes reading-page titles, with Pixelify Sans reused in the open-lab introduction and footer introduction
- **Title:** Bricolage remains in supporting content headings and project titles
- **Body:** The base rhythm is in the frontmatter, with home introduction text at (0.95rem), (1.8) line height and a (26ch) measure
- **Label:** Geographic annotations and main navigation use Monocraft, with sentence labels retained rather than adding promotional kickers

## Layout

The home journey spans (320svh), holding one (100svh) sticky stage while the camera moves through the world, with the title on the left and a vertical station rail on the right

The scene viewport extends beyond the right edge by (23%) on wide screens, and normal reading content uses the fluid gutter and section spacing in the frontmatter

- At (1050px) and below, intermediate rules widen the copy and narrow the station rail, with the final cascade retaining the home title's (37%) maximum-width treatment until the mobile breakpoint
- At (720px) and below, copy spans the available width at (18%) from the stage top, the home title becomes `clamp(1.2rem, 6.3vw, 2.8rem)`, station links form three columns and scene-inspection buttons are hidden
- At (370px) and below, station links form two columns and the home title uses (6.3vw)
- On desktop viewports shorter than (650px), the scene rail and hero action hide to keep the world clear, with navigation and membership retained in the header
- At (600px) and below, the gutter is (1.25rem) and section spacing is (3.5rem), with a (1rem) gutter below (300px)
- Reading-page covers occupy (33rem) on wide screens and (29rem) below (720px), using the same landscape image behind an ink scrim and selectable text
- Reduced motion collapses the home journey to one viewport and removes animated transitions

## Elevation & Depth

Depth comes primarily from the rendered landscape, perspective, atmospheric fog and optical materials, with flat interface pills kept legible over the scene

Pointer position moves the scene's directional key light and the spacecraft, allowing cast shadows to respond to the person, while reduced motion removes this pointer movement and makes camera selection immediate

The search dialog uses a diffuse shadow (`0 25px 100px #241d4e50`) and a dimmed backdrop, while buttons and the featured project card have no box shadow

**The Shared World Rule.** Carry the landscape into reading covers so navigation feels like a quieter view of the same place

## Shapes

Actions and route controls use full pills, inspection buttons use circles, and the featured project card uses a restrained rounded rectangle

Fine translucent borders separate controls from scenery, while the power-emblem spacecraft supplies the distinctive curved silhouette within the landscape

## Components

### Buttons and links

Landscape membership, reading and load actions use the landscape pill tokens, with warm hover fill and dark text, while light-surface primary actions use the accent variant

General buttons keep a (3.25rem) minimum height, and scene actions, station links and utility controls use a (2.75rem) baseline, with a visible keyboard outline (`3px solid currentColor`, offset by `6px`) unless a grouped station supplies its own outline

Ordinary reading links use an underline offset by (5px), with no decorative link arrow

### Navigation

The header overlays the home world and uses an ink background on reading pages, while the enhanced menu opens a full-height ink sheet with two arcade-type link columns, changing to one below (720px)

Station pills retain a direct page link alongside an optional eye-shaped scene-inspection button

### Badges

The featured project carries a small filled pill identifying its destination, with the same rounded control grammar rather than an offset paper tab

### Cards and fields

The featured project card is an unrotated, shadowless green surface with a rounded rectangle, while search uses a labelled rounded input on a warm dialog sheet

### Geographic scene and reading cover

The optional canvas layers over a capture of the actual Three.js scene and fades in when ready, with direct links and text remaining available if the scene is unavailable

Campus and Australia captures have desktop and mobile compositions under `public/assets/world`, selected through responsive picture sources at (720px), so the optical object and landscape match the live scene

Camera selection reframes meaningful places and objects, and reading pages reuse these scene captures under an ink scrim

The local world uses real elevation, mapped paths and instanced, branch-and-leaf tree meshes
Forgan Smith carries photo-informed tower and cloister details, while Brisbane combines open 2014 LiDAR building geometry, surrounding mapped footprints and bridge structures
OpenSky aircraft and Translink ferries use timestamped snapshots through a fixed-upstream adapter
Bus and Metro motion follows illustrative route shapes
Local weather comes from Open-Meteo and solar lighting follows UTC
The camera preserves metric scale into a north-up NASA-textured Earth with editable city and landmass labels in `world.toml`

The wordmark puts the UQRL mark between Reality and Labs
Header branding and social/service links use silhouettes with accessible names, while main page navigation keeps visible text

## Do's and Don'ts

### Do:

- **Do** preserve real geographic footprints and keep source provenance in `public/assets/world/SOURCES.md`
- **Do** use Monocraft and Pixelify Sans for brand and geographic hierarchy, with Bricolage for readable body text
- **Do** retain pills, badges, pointer-responsive shadow and a static fallback
- **Do** keep keyboard, touch, reduced-motion and failed-WebGL access to the real links and text

### Don't:

- **Don't** introduce slogans, decorative arrows beside links or a visible pause control
- **Don't** replace the geographic journey with the rejected cutaway room or a generic landing-page layout
- **Don't** inherit superseded pastel fills, hard offset shadows or decorative glyph icons from earlier declarations

## Footer and state

REALITY and LABS form two sliding doors around the central club mark
Hover, keyboard focus and touch reveal social logos plus Sponsorships, About Us, Team and Projects
The interior uses a green reading surface distinct from the dark mark column
Yearly archives live within Team, with legacy archive URLs excluded from the sitemap and canonicalised to their Team equivalents
Zustand vanilla owns geographic progress and exhibit selection
Meshopt WASM decoding is loaded only with the optional world
The world hovers gently at campus while idle and suspends drawing and feed polling when hidden

Team gives the current T3, Officers and General Committee the primary reading plane, with a native collapsed timeline for confirmed years
The homepage owns the geographic ascent; portraits reveal through cropping, project surfaces unfold, sponsor marks resolve into focus and calendar dates slide into alignment
Air controls is an optional camera mode with a clear consent dialog, local preview and stop control, without a camera or model request before explicit activation

## Flight and reading continuity

The opening sits close to the Great Court lawn, with the restored power emblem folding into an angular split-nose ship
Intersecting hoops, blue cockpit light and recessed thruster outlets follow the supplied ship reference without reusing that image as an asset
Native scroll carries the camera along the river corridor into Brisbane and then into orbit, with a single camera interpolation rather than nested smoothing
City labels become keyboard and touch targets for on-demand district fly-ins
The city geometry uses sourced footprints and elevation, with authored landmark silhouettes and explicit provenance limits
A reading route opens beside the retained world on wide screens and below it on mobile
Footer social targets are 64 px, with larger visible marks and the existing sliding doors
The camera mode combines hand, gaze and expression input, with a ship-shaped pointer and bounded physical reactions
All inferred cues remain local to the opt-in session
