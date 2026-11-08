# Pi Rich UI — renderer gallery

These are actual standalone-renderer outputs with illustrative content. The colored
previews use a sample palette; Pi uses the active host theme. They are not browser UI
mockups. SVG exports are documentation assets only: the runtime stays ANSI-only.

[Install](../README.md) · [Reference](REFERENCE.md)

## compare

![compare in a dark sample palette](previews/compare-80-dark.svg)

```xml
<UI>
  <Title>Start with ANSI.</Title>
  <Text>Keep pixel graphics as an optional future renderer.</Text>
  <Grid cols={2} minWidth={28}>
    <Card title="ANSI / Unicode" tone="cyan">
      <Badge tone="success">Current direction</Badge>
      <Text>Text, panels, diagrams and Braille charts.</Text>
      <List><Item>Copyable terminal text</Item><Item>Colors from the Pi theme</Item></List>
      <Caption>Geometry follows terminal cells.</Caption>
    </Card>
    <Card title="PNG" borderTone="muted" titleTone="text">
      <Badge tone="muted">Deferred</Badge>
      <Text>Pixel graphics, arbitrary lines and fonts.</Text>
      <Caption>Image contents cannot be selected as terminal text. Requires image protocol support.</Caption>
    </Card>
  </Grid>
  <Text>The model describes <Span bold>meaning</Span>. The renderer chooses <Span tone="cyan" bold>presentation</Span>.</Text>
  <Callout tone="warning"><Text>Pair semantic colors with visible labels: <Span tone="success">success</Span>, <Span tone="warning">attention</Span>, <Span tone="error">failure</Span>.</Text></Callout>
</UI>
```

### 80 columns

```text
Start with ANSI.

Keep pixel graphics as an optional future renderer.

╭─────────────────────────────────────╮  ╭─────────────────────────────────────╮
│ ANSI / Unicode                      │  │ PNG                                 │
│                                     │  │                                     │
│ ✓ Current direction                 │  │ ○ Deferred                          │
│                                     │  │                                     │
│ Text, panels, diagrams and Braille  │  │ Pixel graphics, arbitrary lines and │
│ charts.                             │  │ fonts.                              │
│                                     │  │                                     │
│ • Copyable terminal text            │  │ Image contents cannot be selected   │
│ • Colors from the Pi theme          │  │ as terminal text. Requires image    │
│                                     │  │ protocol support.                   │
│ Geometry follows terminal cells.    │  │                                     │
╰─────────────────────────────────────╯  ╰─────────────────────────────────────╯

The model describes meaning. The renderer chooses presentation.

▎ Pair semantic colors with visible labels: success, attention, failure.
```

### 40 columns

```text
Start with ANSI.

Keep pixel graphics as an optional
future renderer.

╭──────────────────────────────────────╮
│ ANSI / Unicode                       │
│                                      │
│ ✓ Current direction                  │
│                                      │
│ Text, panels, diagrams and Braille   │
│ charts.                              │
│                                      │
│ • Copyable terminal text             │
│ • Colors from the Pi theme           │
│                                      │
│ Geometry follows terminal cells.     │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ PNG                                  │
│                                      │
│ ○ Deferred                           │
│                                      │
│ Pixel graphics, arbitrary lines and  │
│ fonts.                               │
│                                      │
│ Image contents cannot be selected as │
│ terminal text. Requires image        │
│ protocol support.                    │
╰──────────────────────────────────────╯

The model describes meaning. The
renderer chooses presentation.

▎ Pair semantic colors with visible
▎ labels: success, attention, failure.
```

## architecture

![architecture in a dark sample palette](previews/architecture-80-dark.svg)

```xml
<UI>
  <Title>Rendering inside a Pi reply</Title>
  <Box title="Model response" borderTone="muted" titleTone="muted">
    <Row>
      <Col><Text bold>Ordinary Markdown</Text><Caption>Paragraphs and code</Caption></Col>
      <Col><Text tone="purple" bold>XML composition</Text><Caption>Row · Box · Text</Caption></Col>
    </Row>
  </Box>
  <Row>
    <Col><Text tone="muted">↓</Text><Card title="Pi Markdown" borderTone="muted" titleTone="text"><Caption>Standard rendering</Caption></Card></Col>
    <Col><Text tone="purple">↓</Text><Card title="Rich UI" tone="purple"><Text>Parser → AST</Text><Caption>Layout → ANSI</Caption></Card></Col>
  </Row>
  <Box title="Reply in session history" titlePosition="inside" tone="cyan"><Text>Prose → visual block → more prose</Text></Box>
  <Callout tone="warning"><Text>Native insertion currently depends on Pi's internal Markdown API.</Text></Callout>
</UI>
```

### 80 columns

```text
Rendering inside a Pi reply

╭─ Model response ─────────────────────────────────────────────────────────────╮
│ Ordinary Markdown                      XML composition                       │
│                                                                              │
│ Paragraphs and code                    Row · Box · Text                      │
╰──────────────────────────────────────────────────────────────────────────────╯

↓                                        ↓

╭─────────────────────────────────────╮  ╭─────────────────────────────────────╮
│ Pi Markdown                         │  │ Rich UI                             │
│                                     │  │                                     │
│ Standard rendering                  │  │ Parser → AST                        │
╰─────────────────────────────────────╯  │                                     │
                                         │ Layout → ANSI                       │
                                         ╰─────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────────────────────╮
│ Reply in session history                                                     │
│                                                                              │
│ Prose → visual block → more prose                                            │
╰──────────────────────────────────────────────────────────────────────────────╯

▎ Native insertion currently depends on Pi's internal Markdown API.
```

### 40 columns

```text
Rendering inside a Pi reply

╭─ Model response ─────────────────────╮
│ Ordinary Markdown   XML composition  │
│                                      │
│ Paragraphs and      Row · Box · Text │
│ code                                 │
╰──────────────────────────────────────╯

↓

╭──────────────────────────────────────╮
│ Pi Markdown                          │
│                                      │
│ Standard rendering                   │
╰──────────────────────────────────────╯

↓

╭──────────────────────────────────────╮
│ Rich UI                              │
│                                      │
│ Parser → AST                         │
│                                      │
│ Layout → ANSI                        │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Reply in session history             │
│                                      │
│ Prose → visual block → more prose    │
╰──────────────────────────────────────╯

▎ Native insertion currently depends on
▎ Pi's internal Markdown API.
```

## components

![components in a dark sample palette](previews/components-80-dark.svg)

```xml
<UI>
  <Title>A small set of composable primitives</Title>
  <Text>Use layout to explain structure, relationships and decisions.</Text>
  <Grid cols={2} minWidth={25}>
    <Card title="Layout" tone="cyan"><Text>Row · Col · Grid</Text><Caption>Grouping and alignment</Caption></Card>
    <Card title="Content" tone="cyan"><Text>Text · Span · Badge</Text><Caption>Meaning and emphasis</Caption></Card>
    <Card title="Relationships" tone="purple"><Text>Graph · Sequence · Tree</Text><Caption>Structure and interactions</Caption></Card>
    <Card title="Comparisons and data" tone="purple"><Text>Table · Diff · Chart</Text><Caption>Differences and patterns</Caption></Card>
  </Grid>
  <Divider tone="dim"/>
  <Text bold>One thought — one emphasis.</Text>
  <Col gap={0}><Text><Span tone="success">✓</Span> The model describes <Span bold>meaning</Span>.</Text><Text><Span tone="cyan">→</Span> The renderer chooses <Span bold>design</Span>.</Text></Col>
  <Caption>Compact XML. Consistent spacing and palette.</Caption>
</UI>
```

### 80 columns

```text
A small set of composable primitives

Use layout to explain structure, relationships and decisions.

╭─────────────────────────────────────╮  ╭─────────────────────────────────────╮
│ Layout                              │  │ Content                             │
│                                     │  │                                     │
│ Row · Col · Grid                    │  │ Text · Span · Badge                 │
│                                     │  │                                     │
│ Grouping and alignment              │  │ Meaning and emphasis                │
╰─────────────────────────────────────╯  ╰─────────────────────────────────────╯

╭─────────────────────────────────────╮  ╭─────────────────────────────────────╮
│ Relationships                       │  │ Comparisons and data                │
│                                     │  │                                     │
│ Graph · Sequence · Tree             │  │ Table · Diff · Chart                │
│                                     │  │                                     │
│ Structure and interactions          │  │ Differences and patterns            │
╰─────────────────────────────────────╯  ╰─────────────────────────────────────╯

────────────────────────────────────────────────────────────────────────────────

One thought — one emphasis.

✓ The model describes meaning.
→ The renderer chooses design.

Compact XML. Consistent spacing and palette.
```

### 40 columns

```text
A small set of composable primitives

Use layout to explain structure,
relationships and decisions.

╭──────────────────────────────────────╮
│ Layout                               │
│                                      │
│ Row · Col · Grid                     │
│                                      │
│ Grouping and alignment               │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Content                              │
│                                      │
│ Text · Span · Badge                  │
│                                      │
│ Meaning and emphasis                 │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Relationships                        │
│                                      │
│ Graph · Sequence · Tree              │
│                                      │
│ Structure and interactions           │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Comparisons and data                 │
│                                      │
│ Table · Diff · Chart                 │
│                                      │
│ Differences and patterns             │
╰──────────────────────────────────────╯

────────────────────────────────────────

One thought — one emphasis.

✓ The model describes meaning.
→ The renderer chooses design.

Compact XML. Consistent spacing and
palette.
```

## titles

![titles in a dark sample palette](previews/titles-80-dark.svg)

```xml
<UI>
  <Title>Frames and headings are independent</Title>
  <Grid cols={2} minWidth={24}>
    <Box title="Border heading" titlePosition="border" tone="cyan"><Text>A named group with a compact edge label.</Text></Box>
    <Card title="Inside heading" titlePosition="inside" tone="purple"><Text>A comparison card with a content heading.</Text></Card>
    <Card title="Heading above" titlePosition="above" borderTone="muted"><Text>The heading sits outside the boundary.</Text></Card>
    <Box tone="success"><Text bold>Frame without a heading</Text><Text>A self-contained statement.</Text></Box>
  </Grid>
  <Box title="No frame" border={false} titlePosition="above" padding={0}><Text>Layout and typography group this explanation.</Text></Box>
  <Callout title="A callout" tone="warning"><Text>A colored rail highlights a caveat without enclosing the reply.</Text></Callout>
  <Box title="Square outline" border="single" tone="info"><Text>The border style is independent of title placement.</Text></Box>
</UI>
```

### 80 columns

```text
Frames and headings are independent

╭─ Border heading ────────────────────╮  ╭─────────────────────────────────────╮
│ A named group with a compact edge   │  │ Inside heading                      │
│ label.                              │  │                                     │
│                                     │  │ A comparison card with a content    │
│                                     │  │ heading.                            │
╰─────────────────────────────────────╯  ╰─────────────────────────────────────╯

Heading above                            ╭─────────────────────────────────────╮
                                         │ Frame without a heading             │
╭─────────────────────────────────────╮  │                                     │
│ The heading sits outside the        │  │ A self-contained statement.         │
│ boundary.                           │  │                                     │
╰─────────────────────────────────────╯  ╰─────────────────────────────────────╯

No frame

Layout and typography group this explanation.

▎ A callout
▎
▎ A colored rail highlights a caveat without enclosing the reply.

┌─ Square outline ─────────────────────────────────────────────────────────────┐
│ The border style is independent of title placement.                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 40 columns

```text
Frames and headings are independent

╭─ Border heading ─────────────────────╮
│ A named group with a compact edge    │
│ label.                               │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Inside heading                       │
│                                      │
│ A comparison card with a content     │
│ heading.                             │
╰──────────────────────────────────────╯

Heading above

╭──────────────────────────────────────╮
│ The heading sits outside the         │
│ boundary.                            │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ Frame without a heading              │
│                                      │
│ A self-contained statement.          │
╰──────────────────────────────────────╯

No frame

Layout and typography group this
explanation.

▎ A callout
▎
▎ A colored rail highlights a caveat
▎ without enclosing the reply.

┌─ Square outline ─────────────────────┐
│ The border style is independent of   │
│ title placement.                     │
└──────────────────────────────────────┘
```

## dashboard

![dashboard in a dark sample palette](previews/dashboard-100-dark.svg)

```xml
<UI>
  <Title>PI RICH UI 0.5 · illustrative data</Title>
  <Grid cols={3} minWidth={18}>
    <Card title="API"><Metric label="RPS" value={600} tone="cyan"/></Card>
    <Card title="KAFKA"><Metric label="Partitions" value={72} tone="purple"/></Card>
    <Card title="p99"><Diff before={600} after={120} unit="ms" good="down"/></Card>
  </Grid>
  <Table headers="Service,RPS,Status">
    <Tr><Td>API</Td><Td value={600}/><Td><Badge tone="success">Healthy</Badge></Td></Tr>
    <Tr><Td>Orders</Td><Td value={450}/><Td><Badge tone="warning">Check lag</Badge></Td></Tr>
  </Table>
  <Sequence actors="API,DB,Kafka">
    <Step from="API" to="DB" label="Save + outbox"/>
    <Step from="DB" to="API" label="Commit" kind="return" tone="success"/>
    <Note over="DB">Relay reads committed outbox records.</Note>
    <Step from="DB" to="Kafka" label="Relay publishes" tone="purple"/>
  </Sequence>
  <Chart label="Latency · ms" height={4} nice>
    <Series label="p50" values="12,18,14,20,18,16" tone="cyan"/>
    <Series label="p99" values="30,48,35,52,40,45" tone="purple"/>
    <Rule label="SLO" value={50} tone="warning"/>
  </Chart>
  <Row>
    <Tree label="Example modules"><Item label="domain"><Item label="Order.kt"/></Item><Item label="infra"><Item label="OutboxRelay.kt"/></Item></Tree>
    <Timeline direction="TB"><Step label="Prepare" status="done"/><Step label="Shadow" status="active"/><Step label="Switch" status="pending"/></Timeline>
  </Row>
</UI>
```

### 80 columns

```text
PI RICH UI 0.5 · illustrative data

╭────────────────────────╮  ╭───────────────────────╮  ╭───────────────────────╮
│ API                    │  │ KAFKA                 │  │ p99                   │
│                        │  │                       │  │                       │
│ RPS                    │  │ Partitions            │  │ 600 ms → 120 ms       │
│ 600                    │  │ 72                    │  │ Δ -480 ms · -80%      │
│                        │  │                       │  │ ✓ improved            │
╰────────────────────────╯  ╰───────────────────────╯  ╰───────────────────────╯

Service                                 RPS   Status
────────────────────────────────────────────────────────────────────────────────
API                                     600   ✓ Healthy
Orders                                  450   ! Check lag

              API                      DB                      Kafka
               ┊                        ┊                        ┊
1              ┊Save + outbox           ┊                        ┊
               ─────────────────────────▶                        ┊
               ┊                        ┊                        ┊
2              ┊Commit ↩                ┊                        ┊
               ◀╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌                        ┊
               ┊                        ┊                        ┊
   i DB: Relay reads committed outbox records.
               ┊                        ┊                        ┊
3              ┊                        ┊Relay publishes         ┊
               ┊                        ─────────────────────────▶
               ┊                        ┊                        ┊

Latency · ms
60 │⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⢀⣀⣀⣀⡀⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⣀⣀⣀⣀⠤⠤⠤⠤⣀⣀⣀⣀⣀╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤⠤╌⠤
   │ ⢀⣀⣀⡠⠤⠤⠔⠒⠒⠊⠉⠉⠁   ⠈⠉⠉⠉⠉⠑⠒⠒⠒⠒⠢⠤⠤⠤⠤⠒⠒⠒⠒⠉⠉⠉⠉             ⠉⠉⠉⠉⠉⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠉⠉⠉⠉⠉⠉⠉⠉
30 │⠉⠁╌╌╌╌╌⢀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⡀╌╌╌╌╌╌╌╌╌╌╌⣀⣀⣀⣀⣀⣀⣀⣀⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀
 0 │⠉⠉⠉⠉⠉⠉⠉⠁⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⠈⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀
   └────────────────────────────────────────────────────────────────────────────
    0                                                                          5
1 p50  2 p99  SLO = 50

Example modules                            ✓ 1. Prepare [done]
├─ domain                                │
│  └─ Order.kt                             ▶ 2. Shadow [active]
└─ infra                                 │
   └─ OutboxRelay.kt                       ○ 3. Switch [pending]
```

### 40 columns

```text
PI RICH UI 0.5 · illustrative data

╭─────────────────╮  ╭─────────────────╮
│ API             │  │ KAFKA           │
│                 │  │                 │
│ RPS             │  │ Partitions      │
│ 600             │  │ 72              │
╰─────────────────╯  ╰─────────────────╯

╭─────────────────╮
│ p99             │
│                 │
│ 600 ms → 120 ms │
│ Δ -480 ms ·     │
│ -80%            │
│ ✓ improved      │
╰─────────────────╯

Service             RPS   Status
────────────────────────────────────────
API                 600   ✓ Healthy
Orders              450   ! Check lag

        API         DB         Kafka
         ┊           ┊           ┊
1        ┊Save +     ┊           ┊
         ┊outbox     ┊           ┊
         ────────────▶           ┊
         ┊           ┊           ┊
2        ┊Commit ↩   ┊           ┊
         ◀╌╌╌╌╌╌╌╌╌╌╌╌           ┊
         ┊           ┊           ┊
   i DB: Relay reads committed outbox
   records.
         ┊           ┊           ┊
3        ┊           ┊Relay      ┊
         ┊           ┊publishes  ┊
         ┊           ────────────▶
         ┊           ┊           ┊

Latency · ms
60 │⠤⠤╌⠤⠤╌⢀⣀⡀⠤⠤╌⠤⠤╌⠤⠤╌⠤⣀⣀⠤⠤⣀⣀⠤╌⠤⠤╌⠤⠤╌⠤⠤╌
   │ ⣀⡠⠔⠒⠉⠁ ⠈⠉⠑⠒⠒⠤⠤⠒⠒⠉⠉      ⠉⠉⠑⠒⠒⠒⠒⠉⠉⠉⠉
30 │⠉╌╌⢀⣀⣀⣀⣀⣀⣀⡀╌╌╌╌╌⣀⣀⣀⣀⠤⠤⠤⠤⠤⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀
 0 │⠉⠉⠉⠁⡀⡀⡀⡀⡀⡀⠈⠉⠉⠉⠉⠉⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀
   └────────────────────────────────────
    0                                  5
1 p50  2 p99  SLO = 50

Example modules        ✓ 1. Prepare
├─ domain            │ [done]
│  └─ Order.kt       │
└─ infra               ▶ 2. Shadow
   └─ OutboxRelay.k  │ [active]
      t              │
                       ○ 3. Switch
                       [pending]
```

## table

```xml
<Table title="Service health · illustrative data" separators>
  <Table.Column label="Service" minWidth={14}/>
  <Table.Column label="RPS" align="right"/>
  <Table.Column label="p99" unit="ms" warnAbove={100} errorAbove={200}/>
  <Table.Column label="Capacity" format="percent" bar max={1}/>
  <Table.Row>
    <Table.Cell><Text><Icon name="server"/> API</Text></Table.Cell>
    <Table.Cell value={600}/><Table.Cell value={25}/><Table.Cell value={0.32} tone="success"/>
  </Table.Row>
  <Table.Row>
    <Table.Cell>Orders</Table.Cell><Table.Cell value={450}/><Table.Cell value={180}/><Table.Cell value={0.74} tone="warning"/>
  </Table.Row>
  <Table.Row>
    <Table.Cell>Payments</Table.Cell><Table.Cell value={120}/><Table.Cell value={240}/><Table.Cell value={0.9} tone="error"/>
  </Table.Row>
</Table>
```

### 80 columns

```text
Service health · illustrative data
Service                                                RPS        p99   Capacity
────────────────────────────────────────────────────────────────────────────────
▣ API                                                  600      25 ms        32%
                                                                        ███━━━━━
────────────────────────────────────────────────────────────────────────────────
Orders                                                 450   ! 180 ms        74%
                                                                        ██████━━
────────────────────────────────────────────────────────────────────────────────
Payments                                               120   ✗ 240 ms        90%
                                                                        ███████━
```

### 40 columns

```text
Service health · illustrative data
Service
▣ API
RPS: 600
p99: 25 ms
Capacity
32%
█████████████━━━━━━━━━━━━━━━━━━━━━━━━━━━
────────────────────────────────────────
Service: Orders
RPS: 450
p99
! 180 ms
Capacity
74%
██████████████████████████████━━━━━━━━━━
────────────────────────────────────────
Service: Payments
RPS: 120
p99
✗ 240 ms
Capacity
90%
████████████████████████████████████━━━━
```

## diff

```xml
<Col>
  <Row>
    <Diff label="p99 · demo" before={600} after={120} unit="ms" good="down"/>
    <Diff label="Throughput · demo" before={450} after={900} unit="RPS" good="up"/>
  </Row>
  <Diff title="Configuration change · demo" beforeLabel="Previous" afterLabel="Proposed">
    <Before>
worker:
  concurrency: 8
  retries: 3
  timeout: 600ms
    </Before>
    <After>
worker:
  concurrency: 12
  retries: 3
  timeout: 120ms
  idempotency: required
    </After>
  </Diff>
</Col>
```

### 80 columns

```text
p99 · demo                               Throughput · demo
600 ms → 120 ms                          450 RPS → 900 RPS
Δ -480 ms · -80%                         Δ +450 RPS · +100%
✓ improved                               ✓ improved

Configuration change · demo
+3 / −2 lines
− Previous / + Proposed
   1 worker:
−  2   concurrency: 8
+  2   concurrency: 12
   3   retries: 3
−  4   timeout: 600ms
+  4   timeout: 120ms
+  5   idempotency: required
```

### 40 columns

```text
p99 · demo
600 ms → 120 ms
Δ -480 ms · -80%
✓ improved

Throughput · demo
450 RPS → 900 RPS
Δ +450 RPS · +100%
✓ improved

Configuration change · demo
+3 / −2 lines
− Previous / + Proposed
   1 worker:
−  2   concurrency: 8
+  2   concurrency: 12
   3   retries: 3
−  4   timeout: 600ms
+  4   timeout: 120ms
+  5   idempotency: required
```

## sequence

```xml
<Sequence title="Transactional outbox · example" actors="API,Postgres,Relay,Kafka">
  <Step from="API" to="Postgres" label="BEGIN; order + outbox" tone="cyan"/>
  <Step from="Postgres" to="API" label="COMMIT" kind="return" tone="success"/>
  <Step from="Relay" to="Postgres" label="Fetch unpublished events"/>
  <Step from="Relay" to="Kafka" label="Publish" kind="async" tone="purple"/>
  <Step from="Kafka" to="Relay" label="ACK" kind="return" tone="success"/>
  <Step from="Relay" to="Relay" label="Process ACK"/>
  <Note over="Relay,Kafka" tone="warning">A crash before marking sent can cause a repeat publication.</Note>
  <Step from="Relay" to="Postgres" label="Mark sent"/>
</Sequence>
```

### 80 columns

```text
Transactional outbox · example
           API             Postgres             Relay              Kafka
            ┊                  ┊                  ┊                  ┊
1           ┊BEGIN; order +    ┊                  ┊                  ┊
            ┊outbox            ┊                  ┊                  ┊
            ───────────────────▶                  ┊                  ┊
            ┊                  ┊                  ┊                  ┊
2           ┊COMMIT ↩          ┊                  ┊                  ┊
            ◀╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌                  ┊                  ┊
            ┊                  ┊                  ┊                  ┊
3           ┊                  ┊Fetch unpublished ┊                  ┊
            ┊                  ┊events            ┊                  ┊
            ┊                  ◀───────────────────                  ┊
            ┊                  ┊                  ┊                  ┊
4           ┊                  ┊                  ┊Publish ⇢         ┊
            ┊                  ┊                  ───────────────────▶
            ┊                  ┊                  ┊                  ┊
5           ┊                  ┊                  ┊ACK ↩             ┊
            ┊                  ┊                  ◀╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
            ┊                  ┊                  ┊                  ┊
6           ┊                  ┊                  ┊Process ACK       ┊
            ┊                  ┊                  ╶───────┐          ┊
            ┊                  ┊                  ◀───────┘          ┊
            ┊                  ┊                  ┊                  ┊
   i Relay, Kafka: A crash before marking sent can cause a repeat publication.
            ┊                  ┊                  ┊                  ┊
7           ┊                  ┊Mark sent         ┊                  ┊
            ┊                  ◀───────────────────                  ┊
            ┊                  ┊                  ┊                  ┊
```

### 40 columns

```text
Transactional outbox · example

1. API → Postgres: BEGIN; order + outbox

2. Postgres ⇢ API (return): COMMIT

3. Relay → Postgres: Fetch unpublished
events

4. Relay → Kafka (async): Publish

5. Kafka ⇢ Relay (return): ACK

6. Relay → Relay: Process ACK

i Relay, Kafka: A crash before marking
sent can cause a repeat publication.

7. Relay → Postgres: Mark sent
```

## tree

```xml
<Tree label="orders-service · example">
  <Tree.Item label="src/main/kotlin">
    <Tree.Item label="domain" tone="success">
      <Tree.Item label="Order.kt" detail="Aggregate, invariants"/>
      <Tree.Item label="OrderRepository.kt"/>
    </Tree.Item>
    <Tree.Item label="application" tone="info">
      <Tree.Item label="PlaceOrder.kt" detail="Transaction boundary"/>
    </Tree.Item>
    <Tree.Item label="infrastructure" tone="purple">
      <Tree.Item label="PostgresOrderRepository.kt"/>
      <Tree.Item label="OutboxRelay.kt" tone="warning" detail="Idempotent delivery required"/>
    </Tree.Item>
  </Tree.Item>
  <Tree.Item label="tests" collapsed>
    <Tree.Item label="OrderTest.kt"/><Tree.Item label="OutboxTest.kt"/>
  </Tree.Item>
</Tree>
```

### 80 columns

```text
orders-service · example
├─ src/main/kotlin
│  ├─ domain
│  │  ├─ Order.kt
│  │  │  Aggregate, invariants
│  │  └─ OrderRepository.kt
│  ├─ application
│  │  └─ PlaceOrder.kt
│  │     Transaction boundary
│  └─ infrastructure
│     ├─ PostgresOrderRepository.kt
│     └─ OutboxRelay.kt
│        Idempotent delivery required
└─ ▸ tests · 2 hidden
```

### 40 columns

```text
orders-service · example
├─ src/main/kotlin
│  ├─ domain
│  │  ├─ Order.kt
│  │  │  Aggregate, invariants
│  │  └─ OrderRepository.kt
│  ├─ application
│  │  └─ PlaceOrder.kt
│  │     Transaction boundary
│  └─ infrastructure
│     ├─ PostgresOrderRepository.kt
│     └─ OutboxRelay.kt
│        Idempotent delivery required
└─ ▸ tests · 2 hidden
```

## timeline

```xml
<Timeline title="Migration plan · illustrative statuses">
  <Timeline.Step label="Prepare" status="done" detail="Schema and outbox table"/>
  <Timeline.Step label="Shadow" status="active" detail="Compare deliveries without side effects"/>
  <Timeline.Step label="Cut over" status="blocked" detail="Await reconciliation results"/>
</Timeline>
```

### 80 columns

```text
Migration plan · illustrative statuses
✓ 1. Prepare [done]       → ▶ 2. Shadow [active]      → ! 3. Cut over [blocked]
Schema and outbox table     Compare deliveries          Await reconciliation
                            without side effects        results
```

### 40 columns

```text
Migration plan · illustrative statuses
  ✓ 1. Prepare [done]
│ Schema and outbox table
│
  ▶ 2. Shadow [active]
│ Compare deliveries without side
│ effects
│
  ! 3. Cut over [blocked]
  Await reconciliation results
```

## charts-v04

```xml
<Col>
  <Chart label="Latency · illustrative data" unit="ms" height={6} x="0,1,2,5,6,9" nice stats>
    <Series label="p50" values="12,18,14,null,25,20" tone="cyan"/>
    <Series label="p99" values="30,48,35,62,45,52" tone="purple"/>
    <Rule label="SLO" value={50} tone="warning"/>
  </Chart>
  <Chart label="Queue balance · demo" height={4} stats>
    <Series label="balance" values="-5,-3,0,4,2,-2,1" tone="info" interpolate="step"/>
  </Chart>
</Col>
```

### 80 columns

```text
Latency · illustrative data · ms
80 │╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   │                                  ⢀⣀⣀⡠⠤⠤⠔⠒⠒⠤⠤⣀⡀
   │⠒⠒ ⠒⢀⣀⠤⠤⠒⠒⠤⠤⣀⣀ ⠒⠒ ⠒⠒ ⠒⣀⣀⣀⠤⠤⠤⠒⠒⠒⠊⠉⠉⠁ ⠒⠒ ⠒⠒ ⠒⠒ ⠒⠈⠉⠒⠒⠤⠤⠤⠤⠤⠤⠤⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠊⠉⠉⠉⠉⠉⠉
40 │⠤⠒⠒⠉⠁╌╌╌╌╌╌╌╌╌⠉⠉⠒⠒⠒⠉⠉⠉╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   │  ⢀⣀⣀⣀⡠⠤⠤⠤⠤⠤⠤⣀⣀⣀⣀⡀                                ⠈⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒
 0 │⠉⠉⠁⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀
   └────────────────────────────────────────────────────────────────────────────
    0                                                                          9
1 p50  2 p99  SLO = 50
p50: min 12 · max 25 · last 20
p99: min 30 · max 62 · last 52

Queue balance · demo
   4 │╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌⡏⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⣇⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀╌╌╌╌╌╌╌╌╌╌╌╌
   0 │⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⢀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⡇⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⢸⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⢰
-0.5 │╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌⢸╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌⠸⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠼
  -5 │⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣸⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
     └──────────────────────────────────────────────────────────────────────────
      0                                                                        6
min -5 · max 4 · last 1
```

### 40 columns

```text
Latency · illustrative data · ms
80 │╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   │                ⣀⡠⠤⠒⠤⡀
   │⠒⠒⣀⠤⠢⢄⡀⠒ ⠒⢀⣀⠤⠔⠊⠉⠒ ⠒⠒ ⠈⠑⠢⠤⠤⠔⠒⠒⠒⠒⠒⠊⠉⠉⠉
40 │⠔⠊╌╌╌╌⠈⠑⠒⠉⠁╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
   │ ⣀⣀⠤⠤⠤⣀⣀⡀              ⠈⠉⠉⠉⠉⠉⠑⠒⠒⠒⠒⠒⠒
 0 │⠉⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀
   └────────────────────────────────────
    0                                  9
1 p50  2 p99  SLO = 50
p50: min 12 · max 25 · last 20
p99: min 30 · max 62 · last 52

Queue balance · demo
   4 │╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌⡏⠉⠉⠉⠉⢹⣀⣀⣀⣀⣀⡀╌╌╌╌╌
   0 │⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⣀⣀⣀⣀⣀⣀⡇⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡇⡀⡀⡀⡀⢰
-0.5 │╌╌╌╌╌╌╌╌╌╌╌⡇╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌⠧⠤⠤⠤⠤⠼
  -5 │⣀⣀⣀⣀⣀⣸⠉⠉⠉⠉⠉⠁╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
     └──────────────────────────────────
      0                                6
min -5 · max 4 · last 1
```

## layout

```xml
<UI>
  <Grid cols={3} minWidth={18}>
    <Card title="API"><Metric label="RPS · demo" value={600} tone="info"/></Card>
    <Card title="Orders"><Metric label="p99 · demo" value={180} unit="ms" tone="warning"/></Card>
    <Card title="Kafka"><Metric label="Partitions · demo" value={72} tone="purple"/></Card>
    <GridItem span={2}><Card title="Decision"><Text>Keep the database write and outbox record in one transaction.</Text></Card></GridItem>
    <Card title="Status"><Badge tone="success">Ready for review</Badge></Card>
  </Grid>
</UI>
```

### 80 columns

```text
╭────────────────────────╮  ╭───────────────────────╮  ╭───────────────────────╮
│ API                    │  │ Orders                │  │ Kafka                 │
│                        │  │                       │  │                       │
│ RPS · demo             │  │ p99 · demo            │  │ Partitions · demo     │
│ 600                    │  │ 180 ms                │  │ 72                    │
╰────────────────────────╯  ╰───────────────────────╯  ╰───────────────────────╯

╭───────────────────────────────────────────────────╮  ╭───────────────────────╮
│ Decision                                          │  │ Status                │
│                                                   │  │                       │
│ Keep the database write and outbox record in one  │  │ ✓ Ready for review    │
│ transaction.                                      │  │                       │
╰───────────────────────────────────────────────────╯  ╰───────────────────────╯
```

### 40 columns

```text
╭─────────────────╮  ╭─────────────────╮
│ API             │  │ Orders          │
│                 │  │                 │
│ RPS · demo      │  │ p99 · demo      │
│ 600             │  │ 180 ms          │
╰─────────────────╯  ╰─────────────────╯

╭─────────────────╮
│ Kafka           │
│                 │
│ Partitions ·    │
│ demo            │
│ 72              │
╰─────────────────╯

╭──────────────────────────────────────╮
│ Decision                             │
│                                      │
│ Keep the database write and outbox   │
│ record in one transaction.           │
╰──────────────────────────────────────╯

╭─────────────────╮
│ Status          │
│                 │
│ ✓ Ready for     │
│ review          │
╰─────────────────╯
```

