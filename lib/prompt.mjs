// Stable display guidance; appended once per turn, never a new history message.
export const SYSTEM_GUIDE = `Pi Rich UI: optional inline visuals. Emit complete XML on separate lines OUTSIDE fences; prose stays Markdown. Use sparingly, only known data; label invented examples. No JS/CSS/events; {} accepts scalar literals only. Theme/layout automatic. tone=success|error|warning|info|accent|purple|cyan|muted; color=green|red|yellow|blue|gray aliases; never rely on color alone. Use user's language.
Tags: Box/Card(title), Callout; titlePosition=inside|above|border|none; border=rounded|single|left|none; borderTone/titleTone=semantic role. Card defaults inside, Box defaults border; no title is valid. Prefer a panel per idea; use plain text between panels. Row, Col, Grid(cols)/GridItem(span); Text/Title/Caption with Span(tone,bold)/Icon(name); Badge; Metric(label,value,unit,delta,hint); Progress(label,value,max); Graph/Node(id,label)/Edge(from,to); Flow/Step(label); Bars/Bar(label,value). Table(headers)/Tr(values) or Table.Column(label,align,unit,bar,max,warnAbove,errorAbove)+Table.Row/Table.Cell(value). Diff(before,after,unit,good=up|down|neutral), or Diff/Before/After for literal text. Sequence(actors)/Step(from,to,label,kind=call|return|async), Note(over); Tree(label)/Item(label,detail) nests; Timeline/Step(label,status=done|active|pending|blocked|error|skipped,detail). Chart(label,height,unit,nice,stats,x)/Series(label,values,interpolate=linear|step)/Rule(value,label); Sparkline(values). Comma-separated values, null=gap, x=optional increasing numeric coordinates; default axis=sample index. Numeric Diff defaults neutral: set good only when justified. Escape &lt; and &amp; in text.
Examples (demo):
<Card title="Decision" tone="info"><Text>Use ANSI.</Text><Caption>Copyable terminal output.</Caption></Card>
<Callout tone="warning"><Text>Native insertion uses an internal Pi API.</Text></Callout>
<Row><Metric label="RPS" value={600} tone="info"/><Diff label="p99" before={600} after={120} unit="ms" good="down"/></Row>
<Table headers="Service,RPS"><Tr values="API,600"/></Table>
<Sequence actors="API,DB"><Step from="API" to="DB" label="Commit"/></Sequence>
<Tree><Item label="src"><Item label="Order.kt"/></Item></Tree>
<Timeline><Step label="Review" status="active"/></Timeline>
<Chart><Series label="ms" values="12,18,null,14" tone="cyan"/><Rule value={20} label="SLO"/></Chart>`;
export function injectGuidance(event,enabled=true) {
  if(!enabled)return;
  const rules=event.systemPromptOptions?.promptGuidelines;
  if(Array.isArray(rules)){if(!rules.includes(SYSTEM_GUIDE))rules.push(SYSTEM_GUIDE);return;}
  if(typeof event.systemPrompt==='string'&&!event.systemPrompt.includes(SYSTEM_GUIDE))return {systemPrompt:event.systemPrompt+'\n\n'+SYSTEM_GUIDE};
}
