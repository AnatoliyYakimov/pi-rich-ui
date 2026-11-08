import { Surface, vstack, textSurface, fit, graphemes } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { elements, attr, integer, label, text, finite, measureText } from './nodes.mjs';

/** Bounded LCS; equal input order is preserved, with deterministic delete-before-add ties. */
export function diffLines(before, after) {
  const a = before === '' ? [] : before.replace(/\r\n/g, '\n').split('\n');
  const b = after === '' ? [] : after.replace(/\r\n/g, '\n').split('\n');
  if (a.length > 160 || b.length > 160) throw Error('Diff limit: 160 lines per side');
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { out.push({ type: 'equal', text: a[i], before: ++i, after: ++j }); }
    else if (i < a.length && (j === b.length || dp[i + 1][j] >= dp[i][j + 1])) { out.push({ type: 'remove', text: a[i], before: ++i }); }
    else { out.push({ type: 'add', text: b[j], after: ++j }); }
  }
  return out;
}
function codeLines(value, width, ctx) {
  const out = []; let line = '', used = 0;
  for (let g of graphemes(value)) {
    let len = ctx.measure(g); if (len > width) { g = '�'; len = 1; }
    if (used + len > width) { out.push(line); line = ''; used = 0; }
    line += g; used += len;
  }
  out.push(line); return out;
}
function codeCell(content, width, ctx, { mark = ' ', number = '', role = 'text', numbered = true } = {}) {
  const prefix = numbered ? `${mark}${String(number).padStart(3)} ` : `${mark} `;
  const pw = Math.min(prefix.length, Math.max(0, width - 1)), lines = codeLines(content, Math.max(1, width - pw), ctx), out = new Surface(width, lines.length, ctx.measure);
  lines.forEach((line, y) => { out.put(0, y, y === 0 ? fit(prefix, pw) : ' '.repeat(pw), role); out.put(pw, y, line, role); }); return out;
}
function relative(before, after) {
  const delta = after - before, percent = before === 0 ? undefined : delta / Math.abs(before) * 100; return { delta, percent: Number.isFinite(percent) ? percent : undefined };
}
const fmt = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(Object.is(n, -0) ? 0 : n);
export function renderDiff(n, w, ctx) {
  const kids = elements(n), parts = [];
  if (attr(n, 'label') || attr(n, 'title')) parts.push(textSurface(label(n), w, { ...ctx, bold: true }));
  if (n.attrs.before !== undefined || n.attrs.after !== undefined) {
    if (n.attrs.before === undefined || n.attrs.after === undefined || kids.length) throw Error('Numeric Diff requires before and after, without children');
    const before = finite(n, 'before'), after = finite(n, 'after'), { delta, percent } = relative(before, after), good = attr(n, 'good', 'neutral');
    if (!['up', 'down', 'neutral'].includes(good)) throw Error('Diff good must be up, down, or neutral');
    const role = ownTone(n) ?? (delta === 0 ? 'muted' : good === 'neutral' ? 'accent' : (good === 'up' ? delta > 0 : delta < 0) ? 'success' : 'error');
    const suffix = attr(n, 'unit') ? ' ' + attr(n, 'unit') : '';
    parts.push(textSurface(`${fmt(before)}${suffix} → ${fmt(after)}${suffix}`, w, { ...ctx, bold: true }));
    parts.push(textSurface(`Δ ${delta > 0 ? '+' : ''}${fmt(delta)}${suffix} · ${percent === undefined ? (before === 0 ? 'n/a % (baseline 0)' : 'n/a % (overflow)') : `${percent > 0 ? '+' : ''}${fmt(percent)}%`}`, w, { ...ctx, role }));
    if (good !== 'neutral' && delta !== 0) parts.push(textSurface((good === 'up' ? delta > 0 : delta < 0) ? '✓ improved' : '✗ regressed', w, { ...ctx, role }));
    return vstack(parts, w, 0, ctx.measure);
  }
  const old = kids.filter(c => c.tag === 'before'), next = kids.filter(c => c.tag === 'after');
  if (old.length !== 1 || next.length !== 1 || kids.length !== 2) throw Error('Text Diff requires one Before and one After');
  if (elements(old[0]).length || elements(next[0]).length) throw Error('Before/After require literal text; escape XML brackets');
  // Remove only one layout newline on either end; indentation and blank lines within the code survive.
  const block = node => text(node).replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
  const operations = diffLines(block(old[0]), block(next[0]));
  const added = operations.filter(o => o.type === 'add').length, removed = operations.filter(o => o.type === 'remove').length;
  parts.push(textSurface(added || removed ? `+${added} / −${removed} lines` : '= unchanged', w, { ...ctx, role: 'muted' }));
  const context = integer(n, 'context', 3, 0, 160), visible = new Set();
  if (!added && !removed) operations.forEach((_, i) => visible.add(i));
  operations.forEach((op, i) => { if (op.type !== 'equal') for (let j = Math.max(0, i - context); j <= Math.min(operations.length - 1, i + context); j++) visible.add(j); });
  const ops = []; let omitted = 0;
  operations.forEach((op, i) => { if (!visible.has(i)) omitted++; else { if (omitted) ops.push({ type: 'omit', count: omitted }); omitted = 0; ops.push(op); } });
  if (omitted) ops.push({ type: 'omit', count: omitted });
  const mode = attr(n, 'mode', 'auto'); if (!['auto', 'unified', 'split'].includes(mode)) throw Error('Diff mode must be auto, unified, or split');
  const split = mode !== 'unified' && w >= (mode === 'split' ? 60 : 88);
  const beforeLabel = attr(n, 'beforeLabel', 'Before'), afterLabel = attr(n, 'afterLabel', 'After');
  if(split){
    const side=Math.max(8,measureText(beforeLabel,ctx)+2,measureText(afterLabel,ctx)+2,...ops.filter(o=>o.text!==undefined).map(o=>measureText(o.text,ctx)+5));
    w=Math.min(w,2*side+3);
  }
  const left=Math.floor((w-3)/2),right=w-left-3;
  parts.length=0;
  if(attr(n,'label')||attr(n,'title'))parts.push(textSurface(label(n),w,{...ctx,bold:true}));
  parts.push(textSurface(added||removed?`+${added} / −${removed} lines`:'= unchanged',w,{...ctx,role:'muted'}));
  if(ctx.density!=='compact')parts.push(new Surface(w,1,ctx.measure));
  if (split) {
    const aLabel=textSurface('− '+beforeLabel,left,{...ctx,role:'error'}),bLabel=textSurface('+ '+afterLabel,right,{...ctx,role:'success'});
    const header=new Surface(w,Math.max(aLabel.height,bLabel.height),ctx.measure);header.blit(aLabel);header.blit(bLabel,left+3);parts.push(header);
    const paired = [];
    for (let i = 0; i < ops.length;) {
      const op = ops[i];
      if (op.type === 'omit' || op.type === 'equal') { paired.push(op.type === 'omit' ? op : { a: op, b: op }); i++; continue; }
      const removed = [], added = [];
      while (i < ops.length && ['remove', 'add'].includes(ops[i].type)) { (ops[i].type === 'remove' ? removed : added).push(ops[i++]); }
      for (let j = 0; j < Math.max(removed.length, added.length); j++) paired.push({ a: removed[j], b: added[j] });
    }
    for (const pair of paired) {
      if (pair.type === 'omit') { parts.push(textSurface(`… ${pair.count} unchanged lines`, w, { ...ctx, role: 'dim' })); continue; }
      const a = pair.a ? codeCell(pair.a.text, left, ctx, { mark: pair.a.type === 'remove' ? '−' : ' ', number: pair.a.before, role: pair.a.type === 'remove' ? 'error' : 'muted' }) : new Surface(left, 1, ctx.measure);
      const b = pair.b ? codeCell(pair.b.text, right, ctx, { mark: pair.b.type === 'add' ? '+' : ' ', number: pair.b.after, role: pair.b.type === 'add' ? 'success' : 'muted' }) : new Surface(right, 1, ctx.measure);
      const row = new Surface(w, Math.max(a.height, b.height), ctx.measure); row.blit(a); row.blit(b, left + 3); for (let y = 0; y < row.height; y++) row.put(left + 1, y, '│', 'border'); parts.push(row);
    }
  } else {
    parts.push(textSurface(`− ${beforeLabel} / + ${afterLabel}`, w, { ...ctx, role: 'muted' }));
    for (const op of ops) {
      if (op.type === 'omit') parts.push(textSurface(`… ${op.count} unchanged lines`, w, { ...ctx, role: 'dim' }));
      else parts.push(codeCell(op.text, w, ctx, { mark: op.type === 'add' ? '+' : op.type === 'remove' ? '−' : ' ', number: op.type === 'add' ? op.after : op.before, role: op.type === 'add' ? 'success' : op.type === 'remove' ? 'error' : 'muted', numbered: w >= 20 }));
    }
  }
  return vstack(parts, w, 0, ctx.measure);
}
