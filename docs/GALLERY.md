# Pi Rich UI 0.4 — фактический вывод рендерера

Это вывод standalone renderer, не скриншоты запущенного Pi. Цвета в текстовых блоках не видны.
Примеры содержат вымышленные данные. ANSI-версию общей демонстрации можно посмотреть
через `cat docs/preview-wide.ansi`.

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

### 80 колонок

```text
Service health · illustrative data
Service                                          │     RPS │      p99 │ Capacity
────────────────────────────────────────────────────────────────────────────────
▣ API                                            │     600 │    25 ms │      32%
                                                 │         │          │ ███━━━━━
────────────────────────────────────────────────────────────────────────────────
Orders                                           │     450 │ ! 180 ms │      74%
                                                 │         │          │ ██████━━
────────────────────────────────────────────────────────────────────────────────
Payments                                         │     120 │ ✗ 240 ms │      90%
                                                 │         │          │ ███████━
```

### 40 колонок

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

### 80 колонок

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

### 40 колонок

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

### 80 колонок

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

### 40 колонок

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

### 80 колонок

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

### 40 колонок

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

### 80 колонок

```text
Migration plan · illustrative statuses
✓ 1. Prepare [done]       → ▶ 2. Shadow [active]      → ! 3. Cut over [blocked]
Schema and outbox table     Compare deliveries          Await reconciliation
                            without side effects        results
```

### 40 колонок

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

### 80 колонок

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

### 40 колонок

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

### 80 колонок

```text
╭─ API ──────────────────╮  ╭─ Orders ──────────────╮  ╭─ Kafka ───────────────╮
│ RPS · demo             │  │ p99 · demo            │  │ Partitions · demo     │
│ 600                    │  │ 180 ms                │  │ 72                    │
╰────────────────────────╯  ╰───────────────────────╯  ╰───────────────────────╯

╭─ Decision ────────────────────────────────────────╮  ╭─ Status ──────────────╮
│ Keep the database write and outbox record in one  │  │ ✓ Ready for review    │
│ transaction.                                      │  │                       │
╰───────────────────────────────────────────────────╯  ╰───────────────────────╯
```

### 40 колонок

```text
╭─ API ───────────╮  ╭─ Orders ────────╮
│ RPS · demo      │  │ p99 · demo      │
│ 600             │  │ 180 ms          │
╰─────────────────╯  ╰─────────────────╯

╭─ Kafka ─────────╮
│ Partitions ·    │
│ demo            │
│ 72              │
╰─────────────────╯

╭─ Decision ───────────────────────────╮
│ Keep the database write and outbox   │
│ record in one transaction.           │
╰──────────────────────────────────────╯

╭─ Status ────────╮
│ ✓ Ready for     │
│ review          │
╰─────────────────╯
```

