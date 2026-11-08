import { Surface, vstack, textSurface, fit } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { elements, attr, integer, bool, label, text, fields, node, finite, measureText } from './nodes.mjs';
import { allocate } from './layout.mjs';

function numeric(cell) {
  const raw = attr(cell, 'value', text(cell).trim());
  if (typeof raw === 'boolean' || String(raw).trim() === '' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(raw).trim())) return undefined;
  const value = Number(raw); return Number.isFinite(value) && Math.abs(value) <= 1e15 ? value : undefined;
}
function display(cell, column) {
  const raw = attr(cell, 'value', text(cell).trim()), value = numeric(cell);
  if (value === undefined) return raw === '' ? '—' : String(raw);
  const explicit = ['value','format','digits','unit','group'].some(key => cell.attrs[key] !== undefined) || ['format','digits','unit','group'].some(key => column.attrs[key] !== undefined);
  if (!explicit) return String(raw);
  const digitsRaw = cell.attrs.digits ?? column.attrs.digits;
  const digits = digitsRaw === undefined ? undefined : Math.max(0, Math.min(6, Math.floor(Number(digitsRaw) || 0)));
  const format = attr(cell, 'format', attr(column, 'format', 'number'));
  const number = format === 'percent' ? value * 100 : value;
  const formatted = digits === undefined && number !== 0 && (Math.abs(number) < 1e-6 || Math.abs(number) >= 1e12) ? String(number) : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits ?? 20, minimumFractionDigits: digits ?? 0, useGrouping: bool(cell, 'group', bool(column, 'group', true)) }).format(number);
  const unit = attr(cell, 'unit', attr(column, 'unit', format === 'percent' ? '%' : ''));
  return formatted + (unit ? (unit === '%' ? '' : ' ') + unit : '');
}
function conditional(cell, column) {
  const value = numeric(cell); if (value === undefined) return undefined;
  for (const [key, compare, role] of [
    ['errorAbove', (v, x) => v > x, 'error'], ['errorBelow', (v, x) => v < x, 'error'],
    ['warnAbove', (v, x) => v > x, 'warning'], ['warnBelow', (v, x) => v < x, 'warning'],
  ]) {
    const limit = finite(cell, key, finite(column, key, undefined));
    if (limit !== undefined && compare(value, limit)) return role;
  }
  return undefined;
}
/** Accept both the v0.3 Tr/Th/Td form and namespaced Table.Row/Table.Cell. */
export function tableModel(n) {
  const all = elements(n), columns = all.filter(c => c.tag === 'column');
  let rows = all.filter(c => c.tag === 'tr');
  if (all.some(c => !['column', 'tr'].includes(c.tag))) throw Error('Table children must be Column or Tr/Table.Row');
  if (rows.some(r => r.attrs.values !== undefined && elements(r).length)) throw Error('Table row: use values OR cells');
  const cells = rows.map(r => r.attrs.values !== undefined ? fields(r.attrs.values).map(v => node('td', {}, [v])) : elements(r));
  if (cells.some(row => row.some(c => !['td', 'th'].includes(c.tag)))) throw Error('Table rows accept Td/Th cells');
  const hasHeader = cells[0]?.length > 0 && cells[0].every(c => c.tag === 'th');
  const header = hasHeader ? cells.shift() : undefined; if (hasHeader) rows = rows.slice(1);
  const names = n.attrs.headers === undefined ? undefined : fields(n.attrs.headers);
  const definedCounts = [columns.length,names?.length,header?.length].filter(Boolean);
  if (definedCounts.some(c => c !== definedCounts[0])) throw Error('Table header/column definitions disagree');
  const count = Math.max(columns.length, names?.length ?? 0, header?.length ?? 0, ...cells.map(r => r.length), 0);
  if (count > 12) throw Error('Table limit: 12 columns');
  if (rows.length > 100) throw Error('Table limit: 100 rows');
  const explicitCount = columns.length || names?.length || header?.length;
  if (explicitCount && cells.some(r => r.length > explicitCount)) throw Error('Table has more cells than defined columns');
  if (columns.length && names && names.length !== columns.length) throw Error('Table headers/columns disagree');
  const cols = Array.from({ length: count }, (_, i) => ({ ...node('column'), ...columns[i], attrs: { ...header?.[i]?.attrs, ...columns[i]?.attrs, label: attr(columns[i], 'label', names?.[i] ?? (header?.[i] ? label(header[i]) : String(i + 1))) } }));
  return { cols, rows, cells, hasHeader: !!(hasHeader || names || columns.length) };
}
export function renderTable(n, w, ctx, render) {
  const model = tableModel(n), { cols, rows, cells, hasHeader } = model;
  if (!cols.length) return textSurface('(empty table)', w, ctx);
  const columnNumeric = cols.map((col, i) => cells.length > 0 && cells.filter(r => r[i]).every(r => numeric(r[i]) !== undefined));
  const role = (cell, row, col) => ownTone(cell) ?? ownTone(row) ?? conditional(cell, col) ?? ownTone(col) ?? ctx.tone ?? 'text';
  function cellSurface(cell = node('td', {}, ['—']), row, col, width) {
    const r = role(cell, row, col), cctx = { ...ctx, tone: r };
    const kids = elements(cell);
    let body;
    // Preserve nested badges, bars, sparklines and spans; numeric scalar attributes are formatted.
    if (kids.length) {
      if (kids.every(c => ['span', 'icon', 'badge'].includes(c.tag))) body = render(node('text', { tone: r }, cell.children), width, cctx);
      else body = render(node('col', { gap: 0, tone: r }, cell.children), width, cctx);
    } else {
      const marker = !ownTone(cell) && !ownTone(row) ? conditional(cell, col) : undefined;
      body = textSurface((marker === 'error' ? '✗ ' : marker === 'warning' ? '! ' : '') + display(cell, col), width, { ...ctx, role: r, bold: bool(cell, 'bold') });
    }
    if (bool(cell, 'bar', bool(col, 'bar')) && numeric(cell) !== undefined) {
      const value = numeric(cell), min = finite(cell, 'min', finite(col, 'min', 0)), max = finite(cell, 'max', finite(col, 'max', 100));
      if (max <= min) throw Error('Table bar max must be greater than min');
      const count = Math.round(Math.max(0, Math.min(1, (value - min) / (max - min))) * width), bar = new Surface(width, 1, ctx.measure);
      bar.put(0, 0, '━'.repeat(width), 'dim'); bar.put(0, 0, '█'.repeat(count), r === 'text' ? 'accent' : r);
      body = vstack([body, bar], width, 0, ctx.measure);
      if (value < min || value > max) body = vstack([body, textSurface('! clipped', width, { ...ctx, role: 'warning' })], width, 0, ctx.measure);
    }
    // A semantic threshold always has a visible mark, including monochrome terminals.
    if (kids.length && !ownTone(cell) && !ownTone(row) && conditional(cell, col)) body = vstack([textSurface(role(cell, row, col) === 'error' ? '✗ threshold' : '! threshold', width, { ...ctx, role: r }), body], width, 0, ctx.measure);
    return body;
  }
  const sizes = cols.map((col, i) => {
    const values = cells.map(row => row[i] ? measureText(display(row[i], col), ctx) + (conditional(row[i], col) ? 2 : 0) : 1);
    const natural = Math.max(measureText(label(col), ctx), ...values, 3);
    const min = integer(col, 'minWidth', Math.max(7, Math.min(16, natural)), 1, 80);
    const max = integer(col, 'maxWidth', 96, min, 240);
    return { min, ideal: Math.max(min, Math.min(max, natural)), max, flex: columnNumeric[i] ? 0 : 1 };
  });
  const gap = 3, fits = sizes.reduce((s, x) => s + x.min, 0) + gap * (cols.length - 1) <= w;
  const parts = [];
  if (attr(n, 'title') || attr(n, 'label')) parts.push(textSurface(label(n), w, { ...ctx, bold: true }));
  if (!fits || attr(n, 'layout') === 'stacked') {
    cells.forEach((row, ri) => {
      if (ri) parts.push(textSurface('─'.repeat(w), w, { ...ctx, role: 'border' }));
      cols.forEach((col, ci) => {
        const cell = row[ci] ?? node('td', {}, ['—']);
        if (!elements(cell).length && !bool(cell, 'bar', bool(col, 'bar')) && !conditional(cell, col)) parts.push(textSurface(`${label(col)}: ${display(cell, col)}`, w, { ...ctx, role: role(cell, rows[ri], col) }));
        else { parts.push(textSurface(label(col), w, { ...ctx, role: 'muted', bold: true })); parts.push(cellSurface(cell, rows[ri], col, w)); }
      });
    });
    if (!cells.length) parts.push(textSurface(cols.map(label).join(' · '), w, { ...ctx, role: 'muted' }));
    return vstack(parts, w, 0, ctx.measure);
  }
  const widths = allocate(sizes, w - gap * (cols.length - 1));
  function addRow(surfaces, header = false, originalCells = []) {
    const height = Math.max(1, ...surfaces.map(p => p.height)), out = new Surface(w, height, ctx.measure); let x = 0;
    surfaces.forEach((p, i) => {
      const align = attr(originalCells[i], 'align', attr(cols[i], 'align', columnNumeric[i] ? 'right' : 'left'));
      const cell = new Surface(widths[i], height, ctx.measure);
      for (let y = 0; y < p.height; y++) {
        const plain = p.plain()[y], len = measureText(plain, ctx), offset = align === 'right' ? widths[i] - len : align === 'center' ? Math.floor((widths[i] - len) / 2) : 0;
        for (let px = 0; px < Math.min(widths[i], len); px++) cell.rows[y][offset + px] = { ...p.rows[y][px] };
      }
      out.blit(cell, x); x += widths[i];
      if (i < surfaces.length - 1) { for (let y = 0; y < height; y++) out.put(x + 1, y, '│', 'border'); x += gap; }
    });
    parts.push(out);
    if (header) parts.push(textSurface('─'.repeat(w), w, { ...ctx, role: 'border' }));
  }
  if (hasHeader) addRow(cols.map((col, i) => textSurface(label(col), widths[i], { ...ctx, role: 'muted', bold: true })), true);
  cells.forEach((row, ri) => {
    if (ri && bool(n, 'separators')) parts.push(textSurface('─'.repeat(w), w, { ...ctx, role: 'border' }));
    addRow(cols.map((col, ci) => cellSurface(row[ci], rows[ri], col, widths[ci])), false, row);
  });
  return vstack(parts, w, 0, ctx.measure);
}
