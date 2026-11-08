import { Surface, vstack, textSurface, wrap } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { icon } from './icons.mjs';
import { elements, attr, bool, label, measureText } from './nodes.mjs';

const treeChildren = n => elements(n).filter(c => c.tag === 'item' || c.tag === 'node');
const count = n => treeChildren(n).reduce((sum, c) => sum + 1 + count(c), 0);
export function renderTree(n, w, ctx) {
  const parts = [], title = attr(n, 'label', attr(n, 'title'));
  if (title) parts.push(textSurface(title, w, { ...ctx, bold: true, role: ownTone(n) ?? 'text' }));
  function visit(current, ancestors, last) {
    const kids = treeChildren(current);
    if (elements(current).some(c => !['item', 'node'].includes(c.tag))) throw Error('Tree nodes only contain Item/Tree.Item/Node children');
    const collapsed = bool(current, 'collapsed'), role = ownTone(current) ?? ctx.tone ?? 'text';
    const decoration = attr(current, 'icon') ? icon(attr(current, 'icon')) + ' ' : '';
    const name = label(current) || String(attr(current, 'id', '(unnamed)'));
    const value = `${collapsed && kids.length ? '▸ ' : ''}${decoration}${name}${collapsed && kids.length ? ` · ${count(current)} hidden` : ''}`;
    let prefix = ancestors.map(continuing => continuing ? '│  ' : '   ').join('') + (last ? '└─ ' : '├─ ');
    let continuation = ancestors.map(continuing => continuing ? '│  ' : '   ').join('') + (last ? '   ' : '│  ');
    // Deep trees remain readable; a depth annotation replaces excessive indentation.
    if (measureText(prefix, ctx) > Math.max(0, w - 8)) { prefix = w >= 12 ? `…${ancestors.length + 1} ` : ''; continuation = ' '.repeat(prefix.length); }
    const pw = measureText(prefix, ctx), lines = wrap(value, Math.max(1, w - pw), ctx.measure), out = new Surface(w, lines.length, ctx.measure);
    lines.forEach((line, y) => { out.put(0, y, y === 0 ? prefix : continuation, 'border'); out.put(pw, y, line, role, bool(current, 'bold')); }); parts.push(out);
    if (attr(current, 'detail')) {
      const detail = wrap(String(attr(current, 'detail')), Math.max(1, w - pw), ctx.measure), s = new Surface(w, detail.length, ctx.measure);
      detail.forEach((line, y) => { s.put(0, y, continuation, 'border'); s.put(pw, y, line, 'muted'); }); parts.push(s);
    }
    if (!collapsed) kids.forEach((child, i) => visit(child, [...ancestors, !last], i === kids.length - 1));
  }
  const roots = treeChildren(n);
  if (elements(n).some(c => !['item', 'node'].includes(c.tag))) throw Error('Tree children must be Item or Node');
  roots.forEach((child, i) => visit(child, [], i === roots.length - 1));
  if (!roots.length) parts.push(textSurface('(empty tree)', w, { ...ctx, role: 'muted' }));
  return vstack(parts, w, 0, ctx.measure);
}
