# Changelog

## [0.6.0] - 2026-11-08

- Default to a readable 112-cell root budget with root full/numeric width opt-ins,
  effective maxWidth, structural section panels and content-sized short components.
- Independent semantic card surfaces and borders, two-axis fields, compact status
  pills and wrapped text alignment. Surfaces inherit through nested containers and
  rich table cells; shaded blanks are preserved and every ANSI line is reset.
- Connector arrows with centered wrapped labels, layered/nested-boundary/workflow/
  decision recipes and discoverable local demo commands. Default demo is now layers;
  existing comparison, chart and dashboard commands remain available.
- Natural-width table columns and short split diffs, preserving explicit flex and
  narrow fallback semantics. Short automatic panels retain their structural borders.
- Compact explanatory model guidance includes a genuinely nested boundary and
  retains explicit-cell table guidance and automatic validation feedback from 0.5.4.
  No new dependency/tool schema/runtime; prompt deduplication remains intact.
- Background-correct static SVG cell previews, 51 snapshots and real Pi theme/host
  checks. Excessively long headings truncate with disclosure rather than crashing.

## [0.5.4] - 2026-11-08

- Add a valid explicit-cell table example to the compact model guide; explicitly reject
  JSX arrays and manual reserved fences, and explain delimiter-separated strings.
- Validate completed TUI answers with the existing parser/renderer and send bounded
  English errors to the model, with one automatic correction attempt per real user
  request on Pi 1.5.0. Keep original history; never trigger feedback from rendering.
- Persist attempt attribution with diagnostics, skip pending/ambiguous work, stop after
  a failed correction, and add `PI_RICH_UI_REPAIR=0` as an independent opt-out.
- Test actual packed-extension feedback delivery and request counts in offline Pi
  sessions, including tools, queued follow-ups, boundary composition, and restoration.

## [0.5.3] - 2026-11-08

- Create GitHub Releases without requiring npm publication; npm publishing is now
  an explicit manual opt-in after the existing release checks pass.

- Preserve Rich UI model guidance when an earlier extension (such as pi-memory)
  replaces the complete system prompt. Keep structured injection for ordinary prompts.
- Test the packed extension's model guidance through Pi's real event runner and prompt
  builder, including legacy prompt handlers in either order and repeated injection.

## [0.5.2] - 2026-11-08

- Apache License 2.0, copyright notice and public npm package metadata.
- GitHub Actions checks on Node 22.19, 24 and 26, plus real Pi 1.5.0 integration.
- Verify packed runtime files, reference documentation and every local demo.
- Load the packed TypeScript entry point through Pi's own extension loader.
- Tag-driven npm Trusted Publishing with provenance and GitHub Releases.
- Reject mismatched release tags; safely retry byte-identical npm publications.
- Read the displayed extension version from package.json.

## [0.5.1] — Compact guidance for visual explanations

- English guide now asks for a visual whenever it improves clarity, comprehension or retention.
- Prefer small compositions over long lists and winding explanations; keep supporting prose brief.
- Replace eight isolated examples with three purpose-labeled comparison/interaction/caveat compositions.
- Short rules and element reference: 1,646 core characters, down from 2,296.
- Append the installed reference path for advanced properties instead of injecting its contents or XSD.
- Preserve user-language labels, truthful data, scalar-only XML and idempotent prompt injection.
- No new tools, dependencies or changes to rendering.

---

## [0.5.0] — General-purpose rich terminal design

- btop-inspired semantic outlines, content headings, bold values and muted captions.
- Independent `titlePosition=inside|above|border|none` and `border=rounded|single|left|none`.
- Card defaults to a content heading; Box retains its border-heading default.
- `borderTone` and `titleTone` allow accents without recoloring body prose.
- New Callout rail; frame-free containers and title-less panels.
- Full long headings wrap above a frame rather than being truncated.
- Equal-height container stretch preserves corners, rails and heading position.
- Open-column rich tables, accented headings and optional columnSeparators.
- Optional Metric delta line; dimmer Braille grids, unchanged data semantics.
- General examples: ANSI comparison, renderer architecture, component catalog, heading modes.
- Existing numeric demo retained as /rich-ui dashboard; default demo is now the comparison.
- Actual color-renderer previews in English README and gallery, with dark/light/narrow variants.
- Compact model guide updated (2296 characters); no extra tool schema or model calls.
- 324 automated tests and 39 reviewed snapshots pass; official pi-tui 1.5.0 smoke-tested.
- PNG remains disabled; no additional runtime dependency.

---

## [0.4.0] — 2026-11-08

- Rich Table: intrinsic column sizing, numeric alignment/formatting, semantic thresholds with
  text markers, nested badges/sparklines, mini-bars, narrow record layout, schema validation.
- Diff: numeric delta/percent with explicit desired direction; bounded LCS text diff, context,
  line numbers, preserved indentation, adaptive unified/split layouts.
- Sequence: declared/inferred actors, directional calls/returns/async/self-call, notes,
  numbered lifelines and chronological narrow fallback.
- Tree: nested nodes, details, Unicode continuation branches, static collapsed counts.
- Timeline: explicit statuses, dates/details and adaptive horizontal/vertical layouts.
- Namespaced XML aliases: Table.*, Diff.*, Sequence.*, Tree.*, Timeline.*, Chart.*.
- Layout: intrinsic sizing, wrapped rows, min/max/flex, density, stable Grid tracks and spans.
- Braille: irregular numeric X, nice domains, separate zero line, Rule thresholds,
  step interpolation, observed min/max/last statistics and preserved monochrome scales.
- Surface: safe wide-grapheme replacement; truncation propagates through nested frames.
- Prompt: 1851 characters, compact catalogue and six valid examples, no duplicate injection.
- Added per-component local demos, regression snapshots, host smoke coverage and detailed docs.
- PNG remains disabled; no external runtime dependencies added.
- Host Pi was not available here; adapter is still an isolated internal ABI dependency.

---

## 0.3.0

- ANSI-only runtime; remove SVG/PNG rasterizer and image protocol path. Legacy image/auto selects ANSI with notice.
- Semantic roles with safe aliases and Pi theme mapping; no model-supplied CSS or raw color escapes.
- Neutral transparent containers, coherent role inheritance, role-colored graph edges/table cells.
- Inline Span/Icon composition, word wrapping that preserves styles, status-specific Badge symbols.
- Text glyph icon catalog; no Nerd Fonts or downloaded assets.
- Braille Chart AND Sparkline, shared index/scale, null gaps, clipping warnings, wrapped legends.
- Neutral merged cells with overlap legend; monochrome automatically shows labeled small multiples.
- Consistent Grid minWidth; equal-height sibling cards; tighter progress spacing.
- Brief updated prompt with color instructions and examples; palette/charts display-only commands.
- Regression/geometry/security tests and deterministic ANSI/plain previews.
- Existing guarded internal Markdown adapter retained; real host validation remains necessary.

## 0.2.0

Previous artifact: native ANSI with optional raster output, basic Braille Chart and basic theme roles.
PNG work is deferred, not silently auto-selected.
