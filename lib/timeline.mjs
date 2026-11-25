import { Surface, vstack, textSurface } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { elements, children, attr, label, measureText, node } from './nodes.mjs';
export const STATUSES = Object.freeze({ done: ['✓', 'success'], active: ['▶', 'info'], pending: ['○', 'muted'], blocked: ['!', 'warning'], error: ['✗', 'error'], skipped: ['−', 'dim'] });
const QUIET = new Set(['pending', 'skipped']);
export function renderTimeline(n, w, ctx, render) {
  const steps = elements(n), parts = [];
  if (steps.some(s => s.tag !== 'step' && s.tag !== 'item')) throw Error('Timeline children must be Step/Timeline.Step');
  if (steps.length > 40) throw Error('Timeline limit: 40 steps');
  const title = attr(n, 'title', attr(n, 'label')); if (title) parts.push(textSurface(title, w, { ...ctx, bold: true }));
  const data = steps.map((s, i) => {
    const status = attr(s, 'status'); if (status && !STATUSES[status]) throw Error('Unknown timeline status');
    const [mark, defaultRole] = STATUSES[status] ?? ['●', 'text'], role = ownTone(s) ?? defaultRole;
    const name = attr(s, 'label', attr(s, 'title', elements(s).length ? `Step ${i + 1}` : label(s)));
    const content = [];
    if (attr(s, 'date') || attr(s, 'time')) content.push(node('caption', {}, [String(attr(s, 'date', attr(s, 'time')))]));
    if (attr(s, 'detail')) content.push(node('text', {}, [String(attr(s, 'detail'))]));
    if (s.attrs.label !== undefined || s.attrs.title !== undefined || elements(s).length) content.push(...children(s));
    return { mark, role, name, content, rail: status === 'done' ? role : 'border', labelRole: ownTone(s) ?? (QUIET.has(status) ? 'muted' : 'text') };
  });
  if (!data.length) return vstack([...parts, textSurface('(empty timeline)', w, ctx)], w, 0, ctx.measure);
  const body = (d, width, marked = false) => vstack([textSurface((marked ? d.mark + ' ' : '') + d.name, width, { ...ctx, role: d.labelRole, bold: true }), ...d.content.map(c => render(c, width, ctx))], width, 0, ctx.measure);
  const gap = 2, lane = Math.floor(w / data.length);
  const min = Math.max(16, ...data.map(d => Math.min(28, measureText(d.name, ctx) + gap)));
  const horizontal = attr(n, 'direction', 'auto') !== 'TB' && data.length <= 6 && lane >= min;
  if (horizontal) {
    const starts = data.map((_, i) => i * lane), pieces = data.map((d, i) => body(d, i < data.length - 1 ? lane - gap : w - starts[i]));
    const out = new Surface(w, 1 + Math.max(...pieces.map(p => p.height)), ctx.measure);
    data.forEach((d, i) => {
      out.put(starts[i], 0, d.mark, d.role, true);
      if (i < data.length - 1) out.put(starts[i] + 2, 0, '─'.repeat(lane - 3), d.rail);
      out.blit(pieces[i], starts[i], 1);
    });
    parts.push(out);
  } else {
    const indent = w >= 6 ? 2 : 0, bodyWidth = Math.max(1, w - indent), spacer = ctx.density === 'compact' ? 0 : 1;
    data.forEach((d, i) => {
      const last = i === data.length - 1, p = body(d, bodyWidth, !indent), out = new Surface(w, p.height + (last ? 0 : spacer), ctx.measure);
      out.blit(p, w - bodyWidth);
      if (indent) {
        out.put(0, 0, d.mark, d.role, true);
        if (!last) for (let y = 1; y < out.height; y++) out.put(0, y, '│', d.rail);
      }
      parts.push(out);
    });
  }
  return vstack(parts, w, 0, ctx.measure);
}
