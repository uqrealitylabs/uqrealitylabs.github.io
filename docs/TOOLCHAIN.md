# Toolchain

Repository quality tooling is standardized on pinned Rust-based tools managed by mise; application build and test dependencies remain unchanged.

## Installation

Install mise 2026.7.7 from the official release, then run:

    mise install
    mise run setup

## Common commands

The supported local interface is mise run format, format-check, lint, spell, workflow-check, typecheck, test, build, check, and ci.

Repository actions are grouped by purpose and selected with an argument:

    npm run generate -- <seo|codename VERSION>
    npm run validate -- <content|seo|release|all>
    npm run benchmark -- <report|budgets|all>
    npm run security -- audit

## Tool ownership

Biome 2.5.4 owns JS/TS/JSX/TSX/JSON/JSONC/CSS formatting, linting, and imports. typos 1.48.0 owns spelling. zizmor 1.27.0 owns workflow security. No Rust source is present in this repository, so rustfmt, clippy, nextest, and cargo-deny are not installed.

## Updating tools

Update exact versions in `mise.toml` only after reviewing the upstream release and checksum.

## Exceptions

Deviations require a concrete technical reason, documentation, approval, and a review date.
