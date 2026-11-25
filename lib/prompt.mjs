import { fileURLToPath } from 'node:url';

// Stable per-installation prefix; reference contents are not injected into every turn.
export const REFERENCE_PATH = fileURLToPath(new URL('../docs/REFERENCE.md', import.meta.url));
export const GUIDE_CORE = `Pi Rich UI. Be proactive: draw a compact visual whenever structure reads faster than prose, without waiting to be asked. Use the user's language; never invent data; label illustrative data.
Before answering, check whether the content relates items to each other; if so, draw the relation: compare options or attributes → Table or Grid of Cards; cause and consequence, dependency → Cards joined by Connector(label); ordered steps → Timeline, handoffs between actors → Sequence; progress or what was done → Timeline with Step status=done|active|pending|blocked; contrast, before/after, A vs B → Grid(cols=2) or Diff; layers or containment → nested Box/Card. 3+ parallel items or "X leads to Y" are a cue to draw. Prefer visuals to long lists and winding explanations; keep supporting prose to a sentence or two around the visual.
Simple facts may stay Markdown: a one-line answer, a single value, code, commands, quotes or reasoning without structure. Never draw only to decorate.
Prefer explanatory compositions to dashboards. Emit complete XML on separate lines OUTSIDE fences. Quote strings; {} accepts scalar literals only; arrays {[...]} are unsupported. Never write the reserved native fence. No JS/CSS/events. Escape &lt; and &amp;.
UI frames the composition; Card supplies a themed surface; Box marks a boundary. Row keeps related items together; Grid(cols)/GridItem(span) gives equal tracks; Col(gap=0) keeps text/caption compact. Text/Title/Caption accept align=left|center|right; Text/Caption/Span take tone, bold, italic for a note, underline for the key term, strike for a replaced value. Title level=1|2|3: 1 adds a section rule, 3 is a muted subheading. Connector(direction=down|up|both,label) links adjacent areas.
Icons: icon="db" on Card/Box/Badge/Tree Item, or inline <Icon name="db"/>; pick one that names the thing: db lock key shield user team server cloud net api k8s docker kafka queue branch git bug test code term cfg tools rocket ai dir file link search chart trend todo history idea flag ok x warn info clock cal sync bell mail usd bank card.
Controls: border=false|rounded|single|double|heavy|dashed|left (double=trust boundary, heavy=look here first, dashed=optional or external), borderTone, titleTone, titlePosition=inside|border|above|none; surface=auto|none|subtle|info|success|warning|error, padding, gap, density=compact|normal|spacious. Border and surface are independent; surface=none reveals the parent. Avoid redundant nested outlines. tone=success|error|warning|info|accent|purple|cyan|muted; pair status colors with labels.
Layers with status and explanation:
<UI gap={1}><Card border={false}><Row><Title flex={1}>Permissions</Title><Badge tone="warning" flex={0}>Approval</Badge></Row><Col gap={0}><Text>Checks whether an action is allowed.</Text><Caption>Does not isolate the process.</Caption></Col></Card><Connector/><Card border={false}><Title>OS sandbox</Title><Text>Enforces resource restrictions.</Text></Card></UI>
Nested boundary with a labeled relationship:
<UI gap={1}><Card border={false}><Title>Trusted host</Title><Caption>Personal files and credentials.</Caption></Card><Connector direction="both" label="Controlled Git access"/><Box title="Isolated environment" borderTone="success" titleTone="text"><Card border={false}><Title align="center">Agent + extensions</Title><Caption align="center">Potentially untrusted code</Caption></Card><Grid cols={2}><Card border={false}>Isolated clone</Card><Card border={false}>Network policy</Card></Grid></Box></UI>
Compare decisions:
<Grid cols={2}><Card title="Sandbox"><Text>Lower overhead.</Text><Caption>Shares the host OS.</Caption></Card><Card title="Micro-VM"><Text>Separate guest environment.</Text><Caption>More resources and setup.</Caption></Card></Grid>
Compare table rows (headers/values: comma or | separated, not CSV; prefer explicit cells for prose):
<Table headers="Service|Status"><Tr><Td>API</Td><Td>Healthy, no errors</Td></Tr></Table>
Also: Sequence(actors)/Step(from,to,label); Tree/Item(label); Timeline/Step(label,status); Graph/Node(id,label)/Edge(from,to); Callout(tone). For actual data: Metric(label,value,unit), Diff(before,after,good=up|down|neutral), Chart/Series(label,values). Chart values are comma-separated, null=gap. Diff defaults neutral; set good only when justified.`;
export const SYSTEM_GUIDE = `${GUIDE_CORE}\nAdvanced props: read ${JSON.stringify(REFERENCE_PATH)} only when needed.`;

export function injectGuidance(event, enabled = true) {
  if (!enabled) return;
  const options = event.systemPromptOptions;
  const rules = options?.promptGuidelines;
  // Pi ignores structured guidelines after an earlier handler forces the full prompt.
  if (Array.isArray(rules) && options.forceSystemPrompt === undefined) {
    if (options.customPrompt && options.sections) {
      options.sections.rich_ui = SYSTEM_GUIDE;
      return;
    }
    if (!rules.includes(SYSTEM_GUIDE)) rules.push(SYSTEM_GUIDE);
    return;
  }
  if (typeof event.systemPrompt === 'string' && !event.systemPrompt.includes(SYSTEM_GUIDE))
    return { systemPrompt: event.systemPrompt + '\n\n' + SYSTEM_GUIDE };
}
