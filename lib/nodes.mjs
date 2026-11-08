/** Shared, deliberately small helpers for the restricted XML AST. */
import { clean } from './parser.mjs';
import { graphemes, glyphWidth } from './surface.mjs';
export const elements = n => (n.children ?? []).filter(x => typeof x !== 'string');
export const children = n => (n.children ?? []).filter(x => typeof x !== 'string' || x.trim());
export const attr = (n, key, fallback = '') => n?.attrs?.[key] ?? fallback;
export const bool = (n, key, fallback = false) => n?.attrs?.[key] === undefined ? fallback : ![false, 'false', '0', 0].includes(n.attrs[key]);
export function number(n, key, fallback = 0) {
  const value = Number(attr(n, key, fallback));
  return Number.isFinite(value) ? value : fallback;
}
export const integer = (n, key, fallback, min = 0, max = 240) => Math.max(min, Math.min(max, Math.floor(number(n, key, fallback))));
export const text = n => typeof n === 'string' ? n : (n.children ?? []).map(text).join('');
export const label = n => clean(attr(n, 'label', attr(n, 'title', text(n)))).trim().replace(/\s+/g, ' ');
export const measureText = (s, ctx = {}) => graphemes(clean(s)).reduce((sum, g) => sum + (ctx.measure ?? glyphWidth)(g), 0);
export function finite(n, key, fallback) {
  if (n?.attrs?.[key] === undefined) return fallback;
  const value = Number(n.attrs[key]);
  if (String(n.attrs[key]).trim() === '' || !Number.isFinite(value) || Math.abs(value) > 1e15) throw Error(`${key} must be finite and within ±1e15`);
  return value;
}
/** For compact attributes. Use explicit cell/actor tags when data contains delimiters. */
export const fields = s => String(s).split(String(s).includes('|') ? '|' : ',').map(x => x.trim());
export const node = (tag, attrs = {}, children = []) => ({ tag, attrs, children });
