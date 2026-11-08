import { Surface, textSurface, vstack, wrap } from './surface.mjs';
import { ownTone, roleOf } from './theme.mjs';
import { elements, attr, label, fields, node, measureText } from './nodes.mjs';

export function sequenceModel(n) {
  const kids = elements(n), actors = [], messages = [];
  const explicit = kids.filter(c => c.tag === 'actor');
  if (n.attrs.actors !== undefined && explicit.length) throw Error('Sequence: use actors attribute OR Actor children');
  if (n.attrs.actors !== undefined) fields(n.attrs.actors).forEach(id => actors.push({ id, label: id, role: 'text' }));
  else explicit.forEach(a => actors.push({ id: String(attr(a, 'id')), label: label(a) || String(attr(a, 'id')), role: ownTone(a) ?? 'text' }));
  const specified = actors.length > 0;
  for (const child of kids) {
    if (child.tag === 'actor') continue;
    if (!['step', 'message', 'note'].includes(child.tag)) throw Error('Sequence children: Actor, Step/Message, Note');
    if (child.tag === 'note') { messages.push({ type: 'note', label: label(child), over: attr(child, 'over') ? fields(attr(child, 'over')) : [], role: ownTone(child) ?? 'muted' }); continue; }
    const from = String(attr(child, 'from')), to = String(attr(child, 'to'));
    if (!from || !to) throw Error('Sequence step requires from and to');
    const kind = attr(child, 'kind', 'call'); if (!['call', 'return', 'async'].includes(kind)) throw Error('Sequence kind must be call, return, or async');
    if (!specified) for (const id of [from, to]) if (!actors.some(a => a.id === id)) actors.push({ id, label: id, role: 'text' });
    messages.push({ type: 'step', from, to, label: label(child), kind, role: ownTone(child) ?? (kind === 'return' ? 'muted' : 'accent') });
  }
  const ids = new Map(); actors.forEach((a, i) => { if (!a.id || ids.has(a.id)) throw Error('Sequence actor IDs must be nonempty and unique'); ids.set(a.id, i); });
  if (actors.length > 8 || messages.length > 64) throw Error('Sequence limit: 8 actors / 64 messages');
  messages.forEach(m => { if (m.type === 'step' && (!ids.has(m.from) || !ids.has(m.to)) || m.type === 'note' && m.over.some(id => !ids.has(id))) throw Error('Unknown sequence actor'); });
  return { actors, messages, ids };
}
export function renderSequence(n, w, ctx) {
  const { actors, messages, ids } = sequenceModel(n), parts = [], title = attr(n, 'title', attr(n, 'label'));
  if (title) parts.push(textSurface(title, w, { ...ctx, bold: true }));
  if (!actors.length) return vstack([...parts, textSurface('(empty sequence)', w, ctx)], w, 0, ctx.measure);
  const byId = id => actors[ids.get(id)].label;
  const laneMin = Math.max(10, ...actors.map(a => Math.min(20, measureText(a.label, ctx) + 2)));
  const usable = w - 4, lane = Math.floor(usable / actors.length);
  if (lane < laneMin || w < 28 || attr(n, 'layout') === 'list') {
    if (!messages.length) parts.push(textSurface(actors.map(a => a.label).join(' · '), w, ctx));
    let step = 0;
    for (const m of messages) {
      if (m.type === 'note') parts.push(textSurface(`i ${m.over.length ? m.over.map(byId).join(', ') + ': ' : ''}${m.label}`, w, { ...ctx, role: m.role }));
      else parts.push(textSurface(`${++step}. ${byId(m.from)} ${m.kind === 'return' ? '⇢' : '→'} ${byId(m.to)}${m.kind === 'return' ? ' (return)' : m.kind === 'async' ? ' (async)' : ''}: ${m.label}`, w, { ...ctx, role: m.role }));
    }
    return vstack(parts, w, 1, ctx.measure);
  }
  const centers = actors.map((_, i) => 3 + i * lane + Math.floor(lane / 2));
  const headers = actors.map(a => wrap(a.label, lane - 2, ctx.measure)), hh = Math.max(...headers.map(h => h.length));
  const header = new Surface(w, hh + 1, ctx.measure);
  headers.forEach((lines, i) => { lines.forEach((l, y) => header.put(centers[i] - Math.floor(measureText(l, ctx) / 2), y, l, actors[i].role, true)); header.put(centers[i], hh, '┊', 'border'); }); parts.push(header);
  let step = 0;
  for (const m of messages) {
    if (m.type === 'note') {
      const note = textSurface(`i ${m.over.length ? m.over.map(byId).join(', ') + ': ' : ''}${m.label}`, w - 4, { ...ctx, role: m.role });
      const out = new Surface(w, note.height + 1, ctx.measure); centers.forEach(x => { for (let y = 0; y < out.height; y++) out.put(x, y, '┊', 'border'); }); out.blit(note, 3); parts.push(out); continue;
    }
    step++; const a = centers[ids.get(m.from)], b = centers[ids.get(m.to)], self = a === b;
    const reachRight = self ? a + Math.max(4, Math.floor(lane / 2) - 1) < w : false;
    const start = self ? reachRight ? a + 1 : Math.max(4, a - lane + 2) : Math.min(a, b) + 1;
    const budget = self ? Math.max(5, Math.min(w - start, lane - 2)) : Math.max(4, Math.abs(a - b) - 1);
    const messageLabel = m.label + (m.kind === 'return' ? ' ↩' : m.kind === 'async' ? ' ⇢' : '');
    const lines = wrap(messageLabel, budget, ctx.measure), out = new Surface(w, lines.length + (self ? 3 : 2), ctx.measure);
    centers.forEach(x => { for (let y = 0; y < out.height; y++) out.put(x, y, '┊', 'border'); });
    out.put(0, 0, String(step), 'dim'); lines.forEach((l, y) => out.put(start, y, l, m.role));
    const y = lines.length;
    if (self) {
      const end = reachRight ? Math.min(w - 1, a + Math.max(3, Math.floor(lane / 2) - 1)) : Math.max(4, a - Math.max(3, Math.floor(lane / 2) - 1));
      out.path([[a, y], [end, y], [end, y + 1], [a, y + 1]], m.role); out.put(a, y + 1, reachRight ? '◀' : '▶', m.role);
    } else {
      const left = Math.min(a, b), right = Math.max(a, b), symbol = m.kind === 'return' ? '╌' : '─';
      out.put(left, y, symbol.repeat(right - left + 1), m.role); out.put(b, y, b > a ? '▶' : '◀', m.role);
    }
    parts.push(out);
  }
  return vstack(parts, w, 0, ctx.measure);
}
