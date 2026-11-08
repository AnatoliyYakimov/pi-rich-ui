import { Surface, vstack, textSurface } from './surface.mjs';
import { ownTone, tone, surfaceRole } from './theme.mjs';
import { attr, integer, children, measureText } from './nodes.mjs';
import { icon } from './icons.mjs';

const BORDERS = new Set(['rounded', 'single', 'none', 'left']);
const POSITIONS = new Set(['border', 'inside', 'above', 'none']);
/** Geometry and typography are independent: a title never implies a border. */
export function containerStyle(node, ctx = {}) {
  const raw = attr(node, 'border', node.tag === 'callout' ? 'left' : 'rounded');
  const border = raw === false || raw === 'false' ? 'none' : raw === true || raw === 'true' ? 'rounded' : String(raw);
  const titlePosition = String(attr(node, 'titlePosition', node.tag === 'box' ? 'border' : 'inside'));
  if (!BORDERS.has(border)) throw Error('border must be rounded, single, left, none, or boolean');
  if (!POSITIONS.has(titlePosition)) throw Error('titlePosition must be border, inside, above, or none');
  const semantic = ownTone(node) ?? ctx.tone ?? (node.tag === 'callout' ? 'info' : 'accent');
  const padding = integer(node, 'padding', ctx.density === 'compact' ? 0 : ctx.density === 'spacious' ? 2 : 1, 0, 2);
  const title = attr(node, 'title') ? (attr(node, 'icon') ? icon(attr(node, 'icon')) + ' ' : '') + String(attr(node, 'title')) : '';
  const requested=surfaceRole(attr(node,'surface','auto'));
  const surface=requested==='auto'?(node.tag==='card'?'subtle':'none'):requested;
  return { border, titlePosition, title, padding, semantic, surface,
    borderTone: node.attrs.borderTone === undefined ? semantic : tone(node.attrs.borderTone),
    titleTone: node.attrs.titleTone === undefined ? semantic : tone(node.attrs.titleTone),
  };
}
export function containerInsets(node, ctx = {}) {
  const s = containerStyle(node, ctx);
  return (s.border === 'none' ? 0 : s.border === 'left' ? 1 : 2) + 2 * s.padding;
}
export function renderContainer(node, width, ctx, render, minimumHeight = 0) {
  const style = containerStyle(node, ctx);
  const { title, padding, semantic, borderTone, titleTone } = style;
  // Extremely narrow terminals trade ornament for readable content, preserving labels.
  const border = width < 8 ? 'none' : style.border;
  const pad = width < 8 ? 0 : padding;
  const edges = border === 'none' ? 0 : border === 'left' ? 1 : 2;
  const inner = Math.max(1, width - edges - 2 * pad);
  let titlePosition = style.titlePosition;
  if (titlePosition === 'border' && (border === 'none' || border === 'left')) titlePosition = 'inside';
  // No ellipsis for meaningful titles: long edge titles move above the frame and wrap.
  if (titlePosition === 'border' && title && measureText(title, ctx) > width - 7) titlePosition = 'above';
  const framed = border === 'rounded' || border === 'single';
  const top = framed ? 1 : 0;
  const childCtx = ownTone(node) ? { ...ctx, tone: ownTone(node) } : node.tag === 'callout' ? { ...ctx, tone: semantic } : ctx;
  const gap = integer(node, 'gap', ctx.density === 'compact' ? 0 : ctx.density === 'spacious' ? 2 : 1, 0, 3);
  const body = children(node).map(c => render(c, inner, childCtx));
  if (title && titlePosition === 'inside') body.unshift(textSurface(title, inner, { ...ctx, role: titleTone, bold: true }));
  const content = body.length ? vstack(body, inner, gap, ctx.measure) : new Surface(inner, 1, ctx.measure);
  const heading = title && titlePosition === 'above' ? textSurface(title, width, { ...ctx, role: titleTone, bold: true }) : null;
  const headingHeight = heading ? heading.height + 1 : 0;
  const natural = content.height + 2 * pad + (framed ? 2 : 0) + headingHeight;
  const out = new Surface(width, Math.max(natural, minimumHeight), ctx.measure);
  out.background(0,headingHeight,width,out.height-headingHeight,style.surface);
  if (border==='rounded') {
    for(const y of [headingHeight,out.height-1]) for(const x of [0,width-1]) {
      const cell=out.rows[y]?.[x];if(cell)cell.background=undefined;
    }
  }
  if (heading) out.blit(heading);
  if (framed) out.frame(0, headingHeight, width, out.height - headingHeight, borderTone, titlePosition === 'border' ? title : '', border);
  else if (border === 'left') for (let y = headingHeight; y < out.height; y++) out.put(0, y, '▎', borderTone);
  out.blit(content, (border === 'none' ? 0 : 1) + pad, headingHeight + top + pad);
  // Stretch re-renders only this container, retaining title placement, rail and style.
  out.stretchTo = height => renderContainer(node, width, ctx, render, height);
  return out;
}
