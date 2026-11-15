# Model-visible recipes

These are the complete XML compositions embedded in the system guide. The examples
are illustrative: the model must adapt labels, values and statuses to the actual
question. The renderer and local previews share the same source in `lib/recipes.mjs`.

List them with `/rich-ui recipes`; preview one with `/rich-ui recipe <name>`.
Local demos do not invoke a model or add a model-visible conversation message.

The selection rule is structural: containment calls for nesting, exchanges for
Sequence, chronology for Timeline, dependencies for Graph, and repeated fields for
a table. Compositions can combine these building blocks. Respect explicit prose,
code and table requests; keep trivial facts simple and never invent chart data.

## vps

Two alternatives with a shared constraint: header + peer cards + conclusion.

```xml
<UI><Card border={false}><Title align="center">One VPS, one IP and domain</Title></Card><Grid cols={2}><Card><Badge tone="success">Running</Badge><Title>NaiveProxy</Title><Caption>TCP/443</Caption><Text>Caddy · HTTP/2</Text></Card><Card><Badge tone="info">Adding</Badge><Title>Hysteria2</Title><Caption>UDP/443</Caption><Text>QUIC · HTTP/3</Text></Card></Grid><Caption>TCP and UDP can share port 443. No second domain is needed for this arrangement.</Caption></UI>
```

## boundary

Containment: put components inside their actual boundary.

```xml
<UI><Card border={false}><Title>Developer laptop</Title><Caption>Personal files and credentials</Caption></Card><Connector direction="both" label="Controlled Git access"/><Box title="Isolated workspace" borderTone="success"><Card border={false}><Title>Agent + extensions</Title></Card><Grid cols={2}><Card border={false}>Isolated clone</Card><Card border={false}>Network policy</Card></Grid></Box></UI>
```

## workflow-recipe

Stages with internal groups: cards + labeled connectors.

```xml
<UI><Card border={false}><Title>Prepare the meal</Title><Grid cols={2}><Col gap={0}><Text bold>Ingredients</Text><Caption>Measure and chop</Caption></Col><Col gap={0}><Text bold>Equipment</Text><Caption>Preheat the oven</Caption></Col></Grid></Card><Connector label="Ready to cook"/><Card border={false}><Title>Cook</Title><Text>Follow the recipe temperature and timing.</Text></Card><Connector label="Check doneness"/><Card border={false}><Title>Rest and serve</Title></Card></UI>
```

## messages

Message order between participants: Sequence.

```xml
<Sequence actors="Client,API,Database"><Step from="Client" to="API" label="Create order"/><Step from="API" to="Database" label="Save order + outbox atomically"/><Step from="Database" to="API" label="Commit" kind="return"/><Step from="API" to="Client" label="Order accepted" kind="return"/></Sequence>
```

## rollout

Chronology or staged progress: Timeline.

```xml
<Timeline direction="TB"><Step label="Prepare new version" status="done"/><Step label="Verify one replica" status="active"/><Step label="Roll out remaining replicas" status="pending" detail="Continue after verification"/></Timeline>
```

## hierarchy

Ownership or taxonomy: Tree.

```xml
<Tree label="Application"><Item label="Domain"><Item label="Order"/><Item label="Payment"/></Item><Item label="Infrastructure"><Item label="Postgres adapter"/><Item label="Kafka adapter"/></Item></Tree>
```

## dependencies

Branches or dependencies: Graph; label what each edge means.

```xml
<Graph><Node id="web" label="Web"/><Node id="api" label="API"/><Node id="db" label="Database"/><Node id="cache" label="Cache"/><Edge from="web" to="api" label="requests"/><Edge from="api" to="db" label="persistent records"/><Edge from="api" to="cache" label="cached reads"/></Graph>
```

## trend

Numeric trend from supplied observations: Chart; example values are illustrative.

```xml
<Chart label="Illustrative request latency" unit="ms" height={4}><Series label="p95" values="40,65,45,30"/></Chart>
```

## site-sketch

Static interface sketch: compose a header, hero and navigation cards.

```xml
<UI><Row><Title flex={1}>John's Works</Title><Caption>Projects · Notes · About</Caption></Row><Divider/><Card border={false}><Text tone="info">SOFTWARE &amp; EXPERIMENTS</Text><Title>Building useful things for the web.</Title><Text>Notes on engineering and open-source projects.</Text></Card><Grid cols={2}><Card title="Projects"><Text>Tools and experiments</Text></Card><Card title="Engineering Notes"><Text>Architecture and Linux</Text></Card></Grid><Caption>Static layout sketch; navigation is illustrative.</Caption></UI>
```

## records

Repeated fields and exact lookup: Table, with explicit cells for prose.

```xml
<Table headers="Service|Status"><Tr><Td bold>API</Td><Td>Healthy, no errors</Td></Tr><Tr><Td>Worker</Td><Td>Result: <Span bold>retry required</Span></Td></Tr></Table>
```
