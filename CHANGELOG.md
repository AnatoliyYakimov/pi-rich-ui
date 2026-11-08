# 0.4.0 — 2026-11-08

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

# Changelog

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
