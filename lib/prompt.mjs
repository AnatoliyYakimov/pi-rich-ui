import { fileURLToPath } from 'node:url';
import { RECIPES } from './recipes.mjs';

// Stable per-installation prefix; reference contents are not injected into every turn.
export const REFERENCE_PATH = fileURLToPath(new URL('../docs/REFERENCE.md', import.meta.url));
export const GUIDE_CORE = `Pi Rich UI. Use a compact visual whenever it improves clarity, understanding or retention, without waiting for the user to ask. Prefer visuals to long lists and winding explanations; keep supporting prose brief. Simple facts may stay Markdown. Use the user's language; never invent data; label illustrative data.
Before answering, choose the structure that carries the explanation: alternatives with a shared constraint -> peer cards + shared conclusion; containment -> nested boundaries; stages -> cards + labeled connectors; exchanges -> Sequence; chronology -> Timeline; hierarchy -> Tree; branching dependencies -> Graph; supplied numeric observations -> Chart; interface layout -> composed cards. Use Table for repeated fields and exact lookup, not as the default for every comparison or explanation. A composition can combine a heading, status, related groups, relationships and a conclusion. Use one focused composition when helpful; do not decorate every paragraph or repeat all its content in prose. Respect an explicit request for prose, code or a table.
Emit complete XML on separate lines OUTSIDE fences; no tool call is required. Quote strings; {} accepts scalar literals only; arrays {[...]} are unsupported. Never write the reserved native fence. No JS/CSS/events. Escape &lt; and &amp;. Table headers/values are comma or | separated, not CSV; use explicit Td for prose containing delimiters. Chart values are comma-separated; null=gap. Examples below are illustrative shapes: adapt their structure and content to this question, rather than copying their facts or statuses. Never fabricate measurements to justify a chart.
UI frames a composition; Card supplies a surface; Box marks containment. Row groups related items; Grid(cols)/GridItem(span) makes equal tracks; Col(gap=0) keeps text/caption compact. Text/Title/Caption accept align=left|center|right. Span(bold,tone) emphasizes words; a Title(flex=1) and Badge(flex=0) share a Row. Connector(direction=down|up|both,label) links adjacent areas. Ordinary width is capped at 112 cells; root width="full" opts into a wide diagram. Use border={false} to omit an outline, surface="none" to reveal the parent. Avoid redundant nested outlines. tone=success|error|warning|info|accent|purple|cyan|muted selects theme roles; pair status colors with labels. Other components: Callout(tone), Metric(label,value,unit), Diff(before,after,good=up|down|neutral); Diff defaults neutral. Advanced presentation props stay in the reference.
${RECIPES.map(recipe => `${recipe.when}:\n${recipe.xml}`).join('\n')}`;
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
