import { Surface, vstack, textSurface, wrap, fit } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { elements, children, attr, label, text, measureText, node } from './nodes.mjs';
export const STATUSES = Object.freeze({ done: ['✓', 'success'], active: ['▶', 'info'], pending: ['○', 'muted'], blocked: ['!', 'warning'], error: ['✗', 'error'], skipped: ['−', 'dim'] });
export function renderTimeline(n, w, ctx, render) {
  const steps = elements(n), parts = [];
  if (steps.some(s => s.tag !== 'step' && s.tag !== 'item')) throw Error('Timeline children must be Step/Timeline.Step');
  if (steps.length > 40) throw Error('Timeline limit: 40 steps');
  const title = attr(n, 'title', attr(n, 'label')); if (title) parts.push(textSurface(title, w, { ...ctx, bold: true }));
  const data = steps.map((s, i) => {
    const status = attr(s, 'status'); if (status && !STATUSES[status]) throw Error('Unknown timeline status');
    const [mark, defaultRole] = STATUSES[status] ?? ['○', 'text'], role = ownTone(s) ?? defaultRole;
    const name = attr(s, 'label', attr(s, 'title', elements(s).length ? `Step ${i + 1}` : label(s)));
    const heading = `${mark} ${i + 1}. ${name}${status ? ' [' + status + ']' : ''}`;
    const content = [];
    if (attr(s, 'date') || attr(s, 'time')) content.push(node('caption', {}, [String(attr(s, 'date', attr(s, 'time')))]));
    if (attr(s, 'detail')) content.push(node('text', {}, [String(attr(s, 'detail'))]));
    if (s.attrs.label !== undefined || s.attrs.title !== undefined || elements(s).length) content.push(...children(s));
    return { heading, role, content };
  });
  if (!data.length) return vstack([...parts, textSurface('(empty timeline)', w, ctx)], w, 0, ctx.measure);
  const gap = 3, lane = Math.floor((w - gap * (data.length - 1)) / data.length);
  const min = Math.max(18, ...data.map(d => Math.min(30, measureText(d.heading, ctx))));
  const horizontal = attr(n, 'direction', 'auto') !== 'TB' && data.length <= 6 && lane >= min;
  if (horizontal) {
    const widths = data.map((_, i) => lane + (i < (w - gap * (data.length - 1)) % data.length ? 1 : 0));
    const pieces = data.map((d, i) => vstack([textSurface(d.heading, widths[i], { ...ctx, role: d.role, bold: true }), ...d.content.map(c => render(c, widths[i], ctx))], widths[i], 0, ctx.measure));
    const out = new Surface(w, Math.max(...pieces.map(p => p.height)), ctx.measure); let x = 0;
    pieces.forEach((p, i) => { out.blit(p, x); x += widths[i]; if (i < pieces.length - 1) { out.put(x, 0, ' → ', 'border'); x += gap; } }); parts.push(out);
  } else {
    data.forEach((d, i) => {
      const bodyWidth = Math.max(1, w - (w >= 6 ? 2 : 0)), indent = w - bodyWidth;
      const p = vstack([textSurface(d.heading, bodyWidth, { ...ctx, role: d.role, bold: true }), ...d.content.map(c => render(c, bodyWidth, ctx))], bodyWidth, 0, ctx.measure);
      const out = new Surface(w, p.height + (i < data.length - 1 ? 1 : 0), ctx.measure); out.blit(p, indent);
      if (i < data.length - 1 && indent) for (let y = 1; y < out.height; y++) out.put(0, y, '│', 'border'); parts.push(out);
    });
  }
  return vstack(parts, w, 0, ctx.measure);
}
