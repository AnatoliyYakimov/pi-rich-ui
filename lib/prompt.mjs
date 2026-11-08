import { fileURLToPath } from 'node:url';

// Stable per-installation prefix; reference contents are not injected into every turn.
export const REFERENCE_PATH = fileURLToPath(new URL('../docs/REFERENCE.md', import.meta.url));
export const GUIDE_CORE = `Pi Rich UI. Use a compact visual whenever it improves clarity, understanding or retention. Prefer visuals to long lists and winding explanations; keep supporting prose brief. Simple facts may stay Markdown. Use the user's language; never invent data; label illustrative data.
Emit complete XML blocks on separate lines OUTSIDE fences. Quote strings; {} accepts scalar literals only. No JS/CSS/events. Escape &lt; and &amp;. Theme/layout automatic. tone=success|error|warning|info|accent|purple|cyan|muted; pair status colors with labels.
Compose Row/Col/Grid(cols)/GridItem(span), Card/Box(title), Text/Span(tone,bold), Caption, Badge, Metric(label,value,unit). Card headings default inside; frames/headings are optional.
Choose Table(headers)/Tr(values) for comparisons; Graph/Node(id,label)/Edge(from,to) for links; Sequence(actors)/Step(from,to,label) for interactions; Tree/Item(label) for nesting; Timeline/Step(label,status=done|active|pending|blocked|error|skipped) for stages; Chart/Series(label,values) for trends; Diff(before,after,good=up|down|neutral) for changes; Callout(tone) for caveats. Chart values are comma-separated, null=gap. Diff defaults neutral; set good only when justified.
Compare options:
<Grid cols={2}><Card title="ANSI" tone="info"><Text>Copyable text.</Text></Card><Card title="PNG" borderTone="muted"><Caption>Deferred.</Caption></Card></Grid>
Show interactions:
<Sequence actors="API,DB"><Step from="API" to="DB" label="Save + outbox"/><Step from="DB" to="API" label="Commit" kind="return"/></Sequence>
Highlight a caveat:
<Callout tone="warning"><Text>Native insertion uses an internal Pi API.</Text></Callout>`;
export const SYSTEM_GUIDE = `${GUIDE_CORE}\nAdvanced props: read ${JSON.stringify(REFERENCE_PATH)} only when needed.`;

export function injectGuidance(event, enabled = true) {
  if (!enabled) return;
  const rules = event.systemPromptOptions?.promptGuidelines;
  if (Array.isArray(rules)) {
    if (!rules.includes(SYSTEM_GUIDE)) rules.push(SYSTEM_GUIDE);
    return;
  }
  if (typeof event.systemPrompt === 'string' && !event.systemPrompt.includes(SYSTEM_GUIDE))
    return { systemPrompt: event.systemPrompt + '\n\n' + SYSTEM_GUIDE };
}
