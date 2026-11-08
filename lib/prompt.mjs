import { fileURLToPath } from 'node:url';

// Stable per-installation prefix; reference contents are not injected into every turn.
export const REFERENCE_PATH = fileURLToPath(new URL('../docs/REFERENCE.md', import.meta.url));
export const GUIDE_CORE = `Pi Rich UI. Use a compact visual whenever it improves clarity, understanding or retention. Prefer visuals to long lists and winding explanations; keep supporting prose brief. Simple facts may stay Markdown. Use the user's language; never invent data; label illustrative data.
Prioritize explanatory compositions: layers, nested boundaries, workflows and decisions, not dashboards. Emit complete XML on separate lines OUTSIDE fences. Quote strings; {} accepts scalar literals only; arrays {[...]} are unsupported. Never write the reserved native fence. No JS/CSS/events. Escape &lt; and &amp;.
UI frames the composition; Card supplies a themed surface; Box marks a boundary. Row keeps related items together; Grid(cols)/GridItem(span) gives equal tracks; Col(gap=0) keeps text/caption compact. Text/Title/Caption accept align=left|center|right; Span(tone,bold) styles inline words. Put a growing Title and compact Badge(flex=0) in a Row for headers. Connector(direction=down|up|both,label) links adjacent areas. Use nested cards to explain containment, not a flat node graph.
Layout caps ordinary width at 112 cells; root width="full" requests wide space. Controls: border=false|rounded|single|left, borderTone, titleTone, titlePosition=inside|border|above|none; surface=auto|none|subtle|info|success|warning|error, padding, gap, density=compact|normal|spacious. Border and surface are independent; surface=none reveals the parent. Avoid redundant nested outlines. tone=success|error|warning|info|accent|purple|cyan|muted; pair status colors with labels. Theme selects actual shades.
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
  const rules = event.systemPromptOptions?.promptGuidelines;
  // Pi ignores structured guidelines after an earlier handler forces the full prompt.
  if (Array.isArray(rules) && event.systemPromptOptions.forceSystemPrompt === undefined) {
    if (!rules.includes(SYSTEM_GUIDE)) rules.push(SYSTEM_GUIDE);
    return;
  }
  if (typeof event.systemPrompt === 'string' && !event.systemPrompt.includes(SYSTEM_GUIDE))
    return { systemPrompt: event.systemPrompt + '\n\n' + SYSTEM_GUIDE };
}
