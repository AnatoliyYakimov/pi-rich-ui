import { Surface, vstack } from './surface.mjs';
import { containerInsets } from './containers.mjs';
import { renderDiff } from './diff.mjs';
import { children, attr, integer, bool, number, label, text, measureText } from './nodes.mjs';

export const DENSITIES = Object.freeze({ compact: { gap: 0, rowGap: 1, padding: 0 }, normal: { gap: 1, rowGap: 2, padding: 1 }, spacious: { gap: 2, rowGap: 3, padding: 2 } });
export const density = ctx => DENSITIES[ctx.density] ?? DENSITIES.normal;
/** Intrinsic sizing is bounded: text can wrap, but a short badge must not take half a row. */
export function intrinsic(n, ctx = {}) {
  if (typeof n === 'string') return { min: 16, ideal: Math.max(16, Math.min(72, measureText(n, ctx))), max: 240, flex: 1 };
  const kids = children(n), content = label(n) || text(n);
  let min = 16, ideal = Math.max(16, Math.min(72, measureText(content, ctx)));
  let flex=['badge','icon','metric'].includes(n.tag)||(n.tag==='diff'&&n.attrs.before!==undefined)?0:1;
  if (n.tag === 'badge' || n.tag === 'icon') { ideal = Math.max(4, measureText(content, ctx) + (n.tag==='badge'?4:2)); min = Math.min(ideal, 12); }
  if (n.tag === 'metric') ideal = Math.max(16, measureText(attr(n, 'value'), ctx) + measureText(attr(n, 'unit'), ctx) + 1, measureText(label(n), ctx));
  if (['chart', 'graph', 'sequence', 'table', 'diff'].includes(n.tag)) { min = 28; ideal = 60; }
  if(n.tag==='diff' && n.attrs.before!==undefined){
    const preview=renderDiff(n,240,ctx);
    ideal=Math.max(16,...preview.plain().map(line=>measureText(line,ctx)))+(ctx.sections?4:0);
    min=16;
  }
  if (['box', 'card', 'callout', 'col', 'ui', 'grid-item'].includes(n.tag)) {
    const childCtx=['box','card','callout'].includes(n.tag)?{...ctx,sections:false}:ctx;
    const sizes = kids.map(c => intrinsic(c, childCtx));
    flex=Math.max(0,...sizes.map(s=>s.flex));
    const frame = ['box', 'card', 'callout'].includes(n.tag) ? containerInsets(n,ctx) : 0;
    min = Math.min(36, Math.max(16, ...sizes.map(s => s.min)) + frame);
    ideal = Math.max(min, Math.min(96, Math.max(0, ...sizes.map(s => s.ideal)) + frame), measureText(attr(n, 'title'), ctx) + frame + 3);
  }
  if (n.tag === 'row') {
    const sizes = kids.map(c => intrinsic(c, ctx));
    min = Math.min(36, Math.max(16, ...sizes.map(s => s.min)));
    ideal = sizes.reduce((sum, s) => sum + s.ideal, 0) + Math.max(0, sizes.length - 1) * 2;
  }
  min = integer(n, 'minWidth', min, 1, 240);
  const max = integer(n, 'maxWidth', 240, 1, 240);
  min=Math.min(min,max);
  ideal = Math.max(min, Math.min(max, integer(n, 'width', ideal, 1, 240)));
  return { min, ideal, max, flex: Math.max(0, Math.min(8, number(n, 'flex', flex))) };
}
/** Allocate columns in two passes: content demand first, then weighted free space. */
export function allocate(sizes, room) {
  if (!sizes.length) return [];
  const widths = sizes.map(s => s.min);
  let free = room - widths.reduce((a, b) => a + b, 0);
  if (free < 0) throw Error('Layout: minimum widths exceed available space');
  for (const phase of ['ideal', 'max']) {
    while (free > 0) {
      let best = -1, score = -1;
      for (let i = 0; i < sizes.length; i++) {
        const s = sizes[i];
        if (widths[i] >= s[phase] || (phase === 'max' && s.flex === 0)) continue;
        const weight = phase === 'ideal' ? (s.ideal - widths[i]) : s.flex / Math.max(1, widths[i] - s.min + 1);
        if (weight > score) { score = weight; best = i; }
      }
      if (best < 0) break;
      widths[best]++; free--;
    }
  }
  return widths;
}
export function rowPlan(kids, width, gap, ctx, allowWrap = true) {
  const groups = []; let current = [], used = 0;
  kids.forEach((n, index) => {
    const s = intrinsic(n, ctx), min = Math.min(width, s.min);
    if (current.length && (used + gap + min > width || !allowWrap && kids.reduce((sum, k) => sum + intrinsic(k, ctx).min, 0) + gap * (kids.length - 1) > width)) {
      groups.push(current); current = []; used = 0;
    }
    current.push({ index, ...s, min, ideal: Math.max(min, Math.min(width, s.ideal)), max: Math.max(min, Math.min(width, s.max)) });
    used += (current.length > 1 ? gap : 0) + min;
  });
  if (current.length) groups.push(current);
  return groups.map(group => ({ indices: group.map(s => s.index), widths: allocate(group, width - gap * (group.length - 1)) }));
}
function stretch(part, _child, _width, height, _ctx) {
  return part.height < height && typeof part.stretchTo === 'function' ? part.stretchTo(height) : part;
}
function compose(kids, widths, width, gap, ctx, render, { align = 'start', valign = 'stretch' } = {}) {
  const parts = kids.map((child, i) => render(child, widths[i], ctx)), height = Math.max(1, ...parts.map(p => p.height));
  const out = new Surface(width, height, ctx.measure), used = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, kids.length - 1);
  let x = align === 'end' ? width - used : align === 'center' ? Math.floor((width - used) / 2) : 0;
  parts.forEach((p, i) => {
    const part = valign === 'stretch' ? stretch(p, kids[i], widths[i], height, ctx) : p;
    const y = valign === 'bottom' ? height - part.height : valign === 'center' ? Math.floor((height - part.height) / 2) : 0;
    out.blit(part, x, y); x += widths[i] + gap;
  });
  return out;
}
export function renderRow(n, width, ctx, render) {
  const kids = children(n), gap = integer(n, 'gap', density(ctx).rowGap, 0, 4);
  const groups = rowPlan(kids, width, gap, ctx, bool(n, 'wrap', true));
  const parts = groups.map(g => compose(g.indices.map(i => kids[i]), g.widths, width, gap, ctx, render, { align: attr(n, 'align', 'start'), valign: attr(n, 'valign', 'stretch') }));
  return vstack(parts, width, integer(n, 'rowGap', Math.max(1, density(ctx).gap), 0, 4), ctx.measure);
}
/** Stable equal tracks, including the final partial row; GridItem may span tracks. */
export function renderGrid(n, width, ctx, render) {
  const kids = children(n), gap = integer(n, 'gap', density(ctx).rowGap, 0, 4), requested = integer(n, 'columns', integer(n, 'cols', 2, 1, 6), 1, 6);
  const base = n.attrs.minWidth === undefined ? Math.max(16, ...kids.map(k => Math.ceil((intrinsic(k, ctx).min - gap * (integer(k, 'span', 1, 1, requested) - 1)) / integer(k, 'span', 1, 1, requested)))) : integer(n, 'minWidth', 28, 1, 240);
  const cols = Math.max(1, Math.min(requested, Math.floor((width + gap) / (base + gap))));
  const room = width - gap * (cols - 1), tracks = Array.from({ length: cols }, (_, i) => Math.floor(room / cols) + (i < room % cols ? 1 : 0));
  const rows = []; let entries = [], col = 0;
  for (const child of kids) {
    const span = integer(child, 'span', 1, 1, cols);
    if (col + span > cols) { rows.push(entries); entries = []; col = 0; }
    const w = tracks.slice(col, col + span).reduce((a, b) => a + b, 0) + gap * (span - 1);
    entries.push({ child, w, x: tracks.slice(0, col).reduce((a, b) => a + b, 0) + gap * col }); col += span;
  }
  if (entries.length) rows.push(entries);
  const parts = rows.map(entries => {
    const ps = entries.map(e => render(e.child, e.w, ctx)), h = Math.max(1, ...ps.map(p => p.height)), out = new Surface(width, h, ctx.measure);
    entries.forEach((e, i) => out.blit(stretch(ps[i], e.child, e.w, h, ctx), e.x)); return out;
  });
  return vstack(parts, width, integer(n, 'rowGap', Math.max(1, density(ctx).gap), 0, 4), ctx.measure);
}
