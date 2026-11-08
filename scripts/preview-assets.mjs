/** Documentation only: export actual terminal cells as static color previews.
 * No image path is loaded by the extension; previews use the standalone palette. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { renderDocument } from '../lib/render.mjs';
import { PALETTES } from '../lib/theme.mjs';
const output = new URL('../docs/previews/', import.meta.url);
mkdirSync(output, { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[c]);
// Terminal structural cells join at their cell edges regardless of SVG font bearings.
function structure(g,x,y,color) {
  const cx=x+4.5,cy=y+11,style=`stroke="${color}" stroke-width="1" fill="none"`;
  const routes={
    '─':`M${x} ${cy}h9`,'│':`M${cx} ${y}v22`,
    '┌':`M${cx} ${y+22}V${cy}H${x+9}`,'┐':`M${x} ${cy}H${cx}V${y+22}`,
    '└':`M${cx} ${y}V${cy}H${x+9}`,'┘':`M${x} ${cy}H${cx}V${y}`,
    '├':`M${cx} ${y}v22M${cx} ${cy}H${x+9}`,'┤':`M${cx} ${y}v22M${x} ${cy}H${cx}`,
    '┬':`M${x} ${cy}h9M${cx} ${cy}V${y+22}`,'┴':`M${x} ${cy}h9M${cx} ${y}V${cy}`,
    '┼':`M${x} ${cy}h9M${cx} ${y}v22`,
    '╭':`M${cx} ${y+22}V${cy+3}Q${cx} ${cy} ${cx+3} ${cy}H${x+9}`,
    '╮':`M${x} ${cy}H${cx-3}Q${cx} ${cy} ${cx} ${cy+3}V${y+22}`,
    '╰':`M${cx} ${y}V${cy-3}Q${cx} ${cy} ${cx+3} ${cy}H${x+9}`,
    '╯':`M${x} ${cy}H${cx-3}Q${cx} ${cy} ${cx} ${cy-3}V${y}`,
    '╶':`M${cx} ${cy}H${x+9}`,'╴':`M${x} ${cy}H${cx}`,'╵':`M${cx} ${y}V${cy}`,'╷':`M${cx} ${cy}V${y+22}`,
  };
  if(routes[g])return `<path d="${routes[g]}" ${style}/>`;
  if(g==='▎')return `<rect x="${x+1}" y="${y}" width="2" height="22" fill="${color}"/>`;
  if(g.length===1&&g.charCodeAt(0)>=0x2800&&g.charCodeAt(0)<=0x28ff){
    const bits=g.charCodeAt(0)-0x2800,positions=[[1,0,0],[2,0,1],[4,0,2],[64,0,3],[8,1,0],[16,1,1],[32,1,2],[128,1,3]];
    return positions.filter(([mask])=>bits&mask).map(([,dx,dy])=>`<circle cx="${x+2.5+dx*4}" cy="${y+4+dy*4.5}" r="0.9" fill="${color}"/>`).join('');
  }
}
const renders = [['compare',80,'dark'],['compare',80,'light'],['compare',40,'dark'],['architecture',80,'dark'],['components',80,'dark'],['titles',80,'dark'],['dashboard',100,'dark']];
for (const [name, columns, appearance] of renders) {
  const source = readFileSync(new URL(`../examples/${name}.xml`, import.meta.url), 'utf8');
  const surface = renderDocument(source, columns); surface.markTruncated();
  const palette = PALETTES[appearance], cw = 9, ch = 22, padding = 24, heading = 42;
  const width = surface.width * cw + padding * 2, height = surface.height * ch + heading + padding;
  const background = appearance === 'dark' ? '#10171e' : '#f6f8fb';
  const cells = [];
  surface.rows.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell.g.trim() || cell.cont) return;
    const structural=structure(cell.g,padding+x*cw,heading+y*ch,palette[cell.role]??palette.text);
    if(structural!==undefined){cells.push(structural);return;}
    cells.push(`<text x="${padding+x*cw}" y="${heading+y*ch+16}" fill="${palette[cell.role]??palette.text}" textLength="${surface.measure(cell.g)*cw}" lengthAdjust="spacingAndGlyphs"${cell.bold?' font-weight="700"':''}>${escape(cell.g)}</text>`);
  }));
  const label = `Pi Rich UI · ${name} · ${columns} columns · ${appearance} sample palette`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${escape(label)}</title><rect width="100%" height="100%" fill="${background}"/><g font-family="DejaVu Sans Mono, monospace" font-size="14"><text x="${padding}" y="25" fill="${palette.muted}" font-size="11">${escape(label)}</text>${cells.join('')}</g></svg>\n`;
  writeFileSync(new URL(`${name}-${columns}-${appearance}.svg`,output),svg);
}
console.log(`Generated ${renders.length} static documentation previews from the actual cell renderer.`);
