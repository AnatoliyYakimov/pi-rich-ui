# Component reference

Pi Rich UI renders restricted XML blocks inside assistant Markdown. It is a declarative
format, not a React or JavaScript runtime. See the [README](../README.md) for installation
and rendered examples, and the [gallery](GALLERY.md) for complete compositions.

## Syntax

Place complete visual blocks on separate lines **outside Markdown code fences**.
Fenced XML in documentation remains literal code. PascalCase and lowercase tag names
are supported; opening and closing names must match exactly, including case.

Attributes accept quoted strings, scalar numbers and booleans: `value={8}`,
`tone="success"`, `stats`. Expressions, arrays, event handlers, HTML/CSS and external
resources are not supported. Escape `&lt;`, `&amp;` and attribute quotes as `&quot;`.

Namespaced aliases include `Table.Row`, `Table.Cell`, `Table.Head`, `Table.Column`,
`Diff.Before`, `Diff.After`, `Sequence.Actor`, `Sequence.Step`, `Sequence.Message`,
`Sequence.Note`, `Tree.Item`, `Tree.Node`, `Timeline.Step`, `Chart.Series` and `Chart.Rule`.
A layout `Row` is distinct from `Table.Row`.

## Explanatory compositions and section defaults

Prefer layers, nested boundaries, workflows and decision comparisons over synthetic
metric dashboards. See [the gallery](GALLERY.md) for complete recipes.

Ordinary root compositions use `min(available width, 112)` cells, left aligned.
Root `width="full"` requests the host budget (still at most 240). A larger root numeric
`width` can request a larger budget; numeric width remains an ideal preference, not a
fixed width. `maxWidth` limits root and nested blocks; children never escape parents.
`width="full"` on a descendant is rejected.

Root UI has a quiet outer frame. Unstyled top-level content blocks (Table, Diff,
Metric, Graph, Sequence, etc.) receive section panels. Row/Grid/Col remain transparent
layout: they do not invent another common border around already styled cards.
Explicitly styled layouts and Card/Box/Callout stop automatic child decoration.
Text/Title/Caption, Badge/Icon, Spacer/Divider and Connector do not become panels.
Use Box/Card for a common semantic group; explicit border/surface overrides defaults.

`UI` separates sections with 2 empty lines in normal density (compact 0, spacious 3).
`Col gap={0}` groups closely related text/captions. Use `UI gap={1}` for card chains
with arrows. The frame and fields are included in the width budget.

## Panels, frames and headings

Box, Card and Callout share a container renderer. A frame, a title and a semantic
accent are separate choices:

| Property | Values / default |
| --- | --- |
| `title` | Optional text; no title is invented when omitted |
| `titlePosition` | `border`, `inside`, `above`, `none` |
| `border` | `rounded`, `single`, `left`, `none`; boolean false/true are aliases for none/rounded |
| `borderTone` | Semantic role for the outline, independent of body color |
| `titleTone` | Semantic role for the heading, independent of the outline |
| `surface` | `auto`, `none`, `subtle`, `info`, `success`, `warning`, `error` |
| `padding` | Horizontal **and vertical** fields: compact 0, normal 1, spacious 2 |
| `gap`, `density` | Explicit spacing overrides inherited density |

Card defaults to `titlePosition="inside"`; Box defaults to `border`. Both default
to a rounded outline. Callout defaults to a left rail with an inside heading.
The default accent is inherited from the explicit container/parent tone or Pi's
accent role. Plain prose remains neutral; captions remain muted.

Long border headings move above the frame and wrap without ellipsis. A border heading
with no full outline becomes a content heading. `titlePosition="none"` explicitly
suppresses the title. Very narrow terminals prioritize readable content over decoration.
Equal-height rows/grids retain the exact title placement, square/rounded corners and rails.

```xml
<UI>
<Grid cols={2}>
  <Card title="Current option" tone="cyan"><Badge tone="success">Selected</Badge></Card>
  <Card title="Alternative" borderTone="muted" titleTone="text"><Text>Keep as a future option.</Text></Card>
</Grid>
<Callout tone="warning"><Text>Describe limitations alongside the decision.</Text></Callout>
<Box border={false} padding={0}><Text>An explanation that needs no frame.</Text></Box>
</UI>
```

### Surfaces and independent controls

Card `surface="auto"` uses subtle shading; Box/UI auto is transparent. Badge auto
uses a muted status surface by tone. `surface="none"` removes the component's own
shading and reveals its parent; it does not erase an ancestor to terminal default.
A child's explicit surface overrides its parent. Filled blank padding and stretched
rows remain part of the card. Rounded corner cells and above-frame titles retain
the parent surface.

`border={false}` keeps the surface, and `surface="none"` keeps the border:

```xml
<UI gap={1}>
  <Card border={false}><Title>Soft card</Title><Caption>Surface without an outline.</Caption></Card>
  <Box title="Boundary" borderTone="success" surface="none"><Text>Outline without an own background.</Text></Box>
</UI>
```

Backgrounds resolve through Pi's `bg` tokens: subtle/info → customMessageBg,
success → toolSuccessBg, warning → toolPendingBg, error → toolErrorBg. Theme shades
and terminal-default backgrounds are respected. Standalone 256/truecolor previews
use a small light/dark fallback palette; 16-color fallbacks may omit shading.
NO_COLOR/TERM=dumb omit color and bold; captions/status labels/contours preserve
structure. Explicit border=false stays off even without color.

### Headers, pills and text alignment

Text/Title/Caption support `align="left|center|right"` per wrapped line. Badge paints
only its measured label/icon with a small field, not the rest of its allocated row;
inline Badge in Text follows the same bounds. A responsive header:

```xml
<Card border={false}>
  <Row><Title flex={1}>Permissions</Title><Badge tone="warning" flex={0}>Approval</Badge></Row>
  <Col gap={0}><Text>Checks whether an action is allowed.</Text><Caption>Does not isolate the process.</Caption></Col>
</Card>
```

Use one panel per semantic group. Ordinary Markdown can carry the surrounding prose.
The library is for general visual explanations, not only numerical dashboards.
Metric supports optional `delta` and `hint` lines: the renderer does not calculate
or invent either. Values are bold and neutral unless an explicit or inherited tone applies.

## Connector

```xml
<UI gap={1}>
  <Card border={false}><Title>Trusted host</Title></Card>
  <Connector direction="both" label="Controlled access: Git + credential proxy"/>
  <Box title="Isolated environment" borderTone="success"><Text>Untrusted execution.</Text></Box>
</UI>
```

Direction is down (default), up or both. The centered arrow and label express a
relationship between adjacent areas in composition order. Labels wrap without
inventing endpoints. Connector has no own panel or outside spacing; parent gap
controls the distance. It is not a general edge-router for arbitrary nested nodes.

## Rich Table

```xml
<Table headers="Service,RPS">
  <Tr values="API,600"/>
  <Tr values="Orders,450"/>
</Table>
```

```xml
<Table title="Illustrative workload">
  <Table.Column label="Service" minWidth={14}/>
  <Table.Column label="p99" unit="ms" warnAbove={100} errorAbove={200}/>
  <Table.Column label="Load" format="percent" bar max={1}/>
  <Table.Row>
    <Table.Cell>Orders</Table.Cell>
    <Table.Cell value={180}/>
    <Table.Cell value={0.74} tone="warning"/>
  </Table.Row>
</Table>
```

Numeric columns align right automatically. Column/cell options include
`align="left|center|right"`, `digits`, `unit`, `format="number|percent"`, `group={false}`,
`minWidth` and `maxWidth`. Columns grow toward natural content widths; neither text
nor numeric columns absorb unused space by default. Explicit `Table.Column flex={1}`
allows extra growth. Rules stop at the actual column total. For percentages, `0.25` means `25%`. A `value` attribute
specifies a formatted number. Literal cell text such as `001` retains its leading zeros.

Thresholds `warnAbove/errorAbove/warnBelow/errorBelow` use strict comparisons (`>`/`<`).
Errors take precedence over warnings. Threshold states have both a color and a `!`/`✗`
marker. Color priority: cell → row → threshold → column → container. An explicit cell
or row tone overrides both threshold styling and its marker.

Cells may contain Badge, Span/Icon, Sparkline and other blocks. `bar` with `min/max`
adds a mini-bar; out-of-range values receive a visible clipping note. `separators`
adds rules between rows. `columnSeparators` restores optional vertical column rules;
the default table uses open columns with an accented header and a subdued horizontal rule. Narrow tables become labeled records; `layout="stacked"`
forces this view. `headers`/`values` use commas or `|`: this is **not a CSV parser**.
Use explicit cells for values containing delimiters.

`Tr/Th/Td` and `Table.Row/Table.Head/Table.Cell` are interchangeable. Up to 12 columns
and 100 rows are allowed, within the overall node limit. Cells exceeding a declared
schema are rejected; missing cells display `—`.

## Diff

```xml
<Diff label="Example p99" before={600} after={120} unit="ms" good="down"/>
```

Numeric Diff displays before → after, the absolute delta, and `delta / |before| × 100`.
A zero baseline or percentage overflow displays `n/a` with an explanation.
`good="neutral"` is the default: a larger value is not automatically better.
`good="up|down"` sets the desired direction and adds improved/regressed text.
Numeric Diff rounds to three decimal places; use a table for precise fractional values.

```xml
<Diff title="Example configuration change" context={2}>
  <Before>workers: 8
retries: 3</Before>
  <After>workers: 12
retries: 3
idempotency: required</After>
</Diff>
```

Text Diff uses a deterministic line-based LCS, line numbers, preserved indentation,
`−/+` markers and explicitly counted omissions for distant unchanged context.
Up to 160 lines per side. `mode="auto"` uses split view from 88 columns, unified below.
`mode="split"` permits split view from 60 columns; below that it still uses unified.
`mode="unified"` always uses one column. These thresholds use the available **inner**
budget after section fields. Short split diffs use content-sized equal sides instead
of filling the screen; long lines use available space. `beforeLabel/afterLabel` customize headings.
Before/After must contain literal text, with XML brackets escaped. One outer layout
newline is removed from each end.

## Sequence

```xml
<Sequence actors="API,DB,Relay,Kafka">
  <Step from="API" to="DB" label="Write + outbox"/>
  <Step from="DB" to="API" label="Commit" kind="return" tone="success"/>
  <Step from="Relay" to="DB" label="Read outbox"/>
  <Step from="Relay" to="Kafka" label="Publish" kind="async" tone="purple"/>
  <Note over="Relay,Kafka">Repeat delivery is possible.</Note>
</Sequence>
```

Features include lifelines, arrows in both directions, self-calls (`from=to`), dashed
returns, notes and message numbers. Narrow windows use an ordered list with exact
endpoints. `layout="list"` forces this view. Limits: 8 actors and 64 messages/notes.

Instead of `actors`, declare `<Actor id="db" label="PostgreSQL"/>` children. Do not mix
these forms. Without declarations, actors are inferred from from/to in first-use order.
With an explicit actor list, unknown endpoints are rejected. Note accepts `over="A,B"`.
This is an explanatory diagram, not full UML: activation bars and alt/loop/par blocks
are not implemented.

## Tree

```xml
<Tree label="Example modules">
  <Item label="domain"><Item label="Order.kt"/></Item>
  <Item label="infra" tone="purple">
    <Item label="OutboxRelay.kt" detail="Background delivery"/>
  </Item>
</Tree>
```

Tree wraps labels while preserving branches and details. Nodes accept `icon`, `tone`,
`bold` and `detail`. `collapsed` is **static**, with a hidden-descendant count; it is not
clickable. Deep indentation in narrow windows becomes a depth annotation (`…N`).
Aliases inside Tree: Item, Tree.Item, Tree.Node and Node.

## Timeline

```xml
<Timeline title="Example stages">
  <Step label="Prepare" status="done"/>
  <Step label="Verify" status="active" detail="Compare results"/>
  <Step label="Switch" status="blocked" detail="Approval required"/>
</Timeline>
```

Timeline adapts between horizontal and vertical views. `direction="TB"` always uses
vertical layout. Steps accept `label`, `detail`, `date/time` and nested Text/other blocks.
Statuses: done, active, pending, blocked, error, skipped. Each has a symbol, word and color.
No status is inferred when omitted. Up to 40 steps. Content labels come from XML;
built-in annotations such as `[done]` and `improved` are English.

## Adaptive layout

Row considers intrinsic/minimum/ideal content widths. A short Badge need not occupy
half the screen. When space runs out, children wrap **in groups**, not necessarily
one per row. `wrap={false}` stacks the entire row if it cannot fit on one line.
Children accept `minWidth/maxWidth/flex`; `flex={0}` prevents growth beyond ideal width.
`width` is a preference, not a fixed width. `align="start|center|end"`,
`valign="stretch|top|center|bottom"`, `gap` and `rowGap` control placement.

Grid accepts `cols/columns` (1–6), stable track widths, `minWidth`, `gap` and `rowGap`.
A final partial row retains its column widths. `<GridItem span={2}>...</GridItem>`
occupies multiple tracks; spans shrink on resize. Direct sibling Card/Box components
stretch to equal height. Cards nested inside GridItem do not automatically stretch
to match neighboring card heights.

`density="compact|normal|spacious"` is inherited and changes default spacing/padding.
Explicit padding/gap values take precedence.

## Braille charts

```xml
<Chart label="Illustrative latency" unit="ms" height={5}
       x="0,1,2,5,9" nice stats>
  <Series label="p50" values="12,18,null,20,16" tone="cyan"/>
  <Series label="p99" values="30,48,35,52,40" tone="purple"/>
  <Rule value={50} label="SLO" tone="warning"/>
</Chart>
```

Chart and Sparkline use Braille at 2×4 dots per character cell. Up to 4 series ×512
samples; values must be finite and within ±1e15. `null/_` creates a gap; empty CSV
fields are rejected. The default X axis is the sample index: a short series is not
stretched to match a longer one.

`x` provides shared, strictly increasing numeric coordinates; its count must equal
the longest series. Timestamp strings are not parsed, but numeric times/offsets work.
`start/end` change only the endpoint labels.

`nice` rounds automatic domain boundaries, preserving explicit min/max values.
`zero={false}` excludes the mandatory zero from the automatic domain.
`zeroLine={false}` independently hides the zero line. `grid={false}` hides the grid.
`interpolate="linear|step"` applies to Chart or Series; `stroke="dash"` applies to Series.
No smoothing splines or interpolation across missing samples.

Up to four `<Rule value label tone>` thresholds have legends and do not expand the
domain automatically. Out-of-range rules are labeled outside scale. `stats` shows
observed min/max/last values, not domain-clipped values, with compact numeric labels.
`last` means the last non-null observation, not necessarily the last sample index.

Overlapping series in one terminal cell use a neutral color and `+ overlap` legend.
Thresholds and the zero line form a background layer; data dots in the same cell win.
`layout="stacked"` separates series while keeping a shared domain; NO_COLOR selects
this automatically. Narrow views retain every series label, range, threshold and
requested statistic. Multiple levels can occupy one character row at low heights;
use a table or metric alongside the chart when exact values matter.

## Colors and existing components

Roles: `success/error/warning/info/accent/purple/cyan/muted/text/dim/border`.
Aliases include green/red/yellow/blue/gray and positive/negative/orange/violet/teal.
`tone` takes precedence over `color`. Roles resolve through Pi's theme; they are not
guaranteed RGB values. Only explicit/automatic surfaces are shaded; the surrounding
terminal background is untouched. Unicode icons are built
in; Nerd Fonts are not required.

Available components: UI, Box/Card/Callout, Row/Col/Grid/GridItem, Text/Title/Caption, Span,
Icon, Badge, Connector, Divider, Spacer, Metric, Progress, Flow/Step, Graph/Node/Edge, Bars/Bar,
Chart/Series/Rule, Sparkline, Table/Tr/Th/Td/Column, Diff/Before/After,
Sequence/Actor/Message/Note, Tree, Timeline, List/Item and Code.

## Configuration

```bash
PI_RICH_UI_RENDER=ansi pi    # Default native renderer
PI_RICH_UI_RENDER=text pi    # Public hook + plain code fence; no native adapter
PI_RICH_UI_PROMPT=0 pi       # Disable model guidance and automatic correction
PI_RICH_UI_REPAIR=0 pi       # Disable correction; keep guidance/rendering
NO_COLOR=1 pi               # Disable colors/bold; retain Unicode/Braille
```

`PI_RICH_UI_COLORS=16|256|truecolor|none|auto` controls fallback/CLI colors. The active
Pi theme takes precedence except in none mode. NO_COLOR (even empty) and TERM=dumb
disable SGR styling. A Braille-capable terminal font is required for charts.
PNG is disabled; image/auto settings select ANSI with a notice.

## Prompt, history and security

`lib/prompt.mjs` defines an English **3,321-byte UTF-8 core guide**: short behavior
rules, **three explanatory compositions** (layers, a nested boundary and a decision
comparison) and an explicit-cell table. It shows filled cards, header/status alignment,
independent border/surface and labeled relationships rather than requiring the model
to infer them from tag names. Arrays and manual reserved fences are unsupported;
compact `headers`/`values` are delimiter-separated strings, not CSV. It asks the model to use
a compact visual whenever it improves clarity, understanding or retention, rather
than long lists or winding prose. Simple facts can stay Markdown; output labels
follow the user's language. This guides model behavior; it is not a guarantee of
which composition every model will choose.

The full injected guide appends the absolute installed path of this reference,
quoted for spaces/platform separators. Advanced attributes can be read using the
harness's existing file-reading capability only when needed. The reference contents
and an XSD schema are **not** injected every turn; no new tool schema is added.
The final character/token count depends on the installation path and model tokenizer.

`before_agent_start` contributes the guide once to promptGuidelines or appends it
to systemPrompt on the older API. It does not create a history message. Injection
is disabled outside TUI mode; `PI_RICH_UI_PROMPT=0` also disables it.

Original XML stays in the response/history. Transformation is display-only and applies
to assistant prose, not user/thinking messages. Markdown and fenced examples remain
intact. An unfinished streaming block temporarily displays Rendering visual…; completed
blocks render atomically. Resize/history restoration uses original XML. HTML exports
do not receive this renderer.

The parser uses no eval/Function/DOM. OSC/CSI/control/bidi commands are stripped from
text data. XML cannot access the network, shell or filesystem. Limits: 24,000 characters
per block, 300 nodes, depth 20, width up to 240 columns and height 400 rows. Truncation is
explicitly marked. Very narrow windows or oversized documents may not fit all content;
split large visuals into multiple blocks. Invalid original blocks remain source/fenced
XML and are never executed or silently rewritten.

### Automatic correction feedback

On Pi 1.5.0, `agent_before_settle` validates the current completed assistant answer,
using the display parser's standalone-block recognition and existing renderer checks
at widths 24 and 80. This is not a full component schema, all-width guarantee, or fact
checker. It skips ordinary code fences, inline/indented examples, unknown XML, pending
work, tool-call answers, thinking, errors/aborts, and ambiguous request attribution.
An unfinished known-root block in a final answer is invalid; a partial streaming block
is not checked. A top-level reserved native fence receives protocol guidance, while a
nested example inside an ordinary documentation fence remains literal.

For actionable failures it appends a hidden, model-visible English diagnostic and
requests one continuation. The diagnostic includes up to three errors, source lines,
short sanitized excerpts, and syntax hints (at most 2,400 characters total). The model
is asked to return only corrected visuals, preserving content, without tools or repeated
work; it may fall back to ordinary Markdown. These are model instructions, not changes
to tool permissions or a guarantee that every model obeys them.

The diagnostic's persisted metadata identifies the real user and assistant entries.
There is at most one automatic attempt per user request on the active branch, including
queued user requests; extension-authored custom messages do not reset it. A committed
diagnostic spends the budget even if continuation is suppressed. Reloading/compacting
does not erase an attempt marker retained on the raw branch. Missing request identity
fails closed instead of guessing. A still-invalid correction shows one warning and
requests no further correction. Original answers are retained; corrections are new
assistant messages, so history and exports are not silently rewritten.

Correction is enabled only in TUI mode with a Markdown transformer and model guidance,
for both native ANSI and text fallback. `PI_RICH_UI_REPAIR=0` disables it independently;
`PI_RICH_UI_PROMPT=0` also disables it. `/rich-ui status` reports the configured setting,
not an unprobed host capability. Older hosts without this boundary keep rendering
without automatic feedback. Valid answers incur no extra model request; invalid answers
can incur one, with additional latency/tokens. No feedback is generated by rendering,
scrolling, resizing, restoring old history, or invoking local demo commands.

## Development and validation

```bash
npm test
npm run check
npm run preview -- --width 96
npm run preview -- --file examples/sequence.xml --width 80
npm run preview -- --file examples/table.xml --plain --width 40
npm run bench
npm run test:host
# Only after reviewing intentional rendering changes:
npm run snapshots:update
```

The repository includes explanatory/per-component examples, unit/integration doubles, 51 golden
snapshots (40/80/120 columns), width sweeps 1–160, and Unicode/ANSI, streaming, validation,
theme inheritance, prompt and adapter-lifecycle checks.

`docs/TEST-RESULTS.txt` records the build test run; `docs/CHECK-RESULTS.txt` records syntax
checks. `docs/BENCHMARK.json` is a synthetic benchmark, **not** real Pi latency.
`docs/preview-*.txt` contains monochrome output; view `docs/preview-*.ansi` with `cat`.

The readable-layout feature was validated on Node 26.12.0. The package requires Node >=22.19.0.
The real Markdown integration was exercised against official `@earendil-works/pi-tui`
1.5.0, covering 17 examples at 24/40/80/120 columns. The suite also covers completed-answer
validation and correction budgets. With `PI_AGENT_MODULE` set, packed-extension checks
exercise real offline Pi sessions with a deterministic local provider; they make no
external model requests. See current test output for the suite count.
An earlier offline interactive Pi 1.5.0 PTY smoke test loaded the baseline extension and its local
demos in regular/fullscreen modes. No model request was made; physical terminal/font
behavior remains a separate check. See [TUI smoke record](TUI-SMOKE.txt).

Integration references checked 2026-11-08:

- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/themes
- https://raw.githubusercontent.com/earendil-works/pi/main/packages/tui/src/components/markdown.ts
- https://raw.githubusercontent.com/earendil-works/pi/main/packages/tui/package.json

Dependencies and fonts are not bundled. See [integration details](INTEGRATION.md),
[gallery](GALLERY.md) and [changelog](../CHANGELOG.md).
