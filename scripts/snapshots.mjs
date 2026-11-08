import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { renderDocument } from '../lib/render.mjs';
// Explicit opt-in: updating snapshots is a review operation, never part of npm test.
if (!process.argv.includes('--update')) throw Error('Use --update after reviewing renderer changes');
const output = new URL('../tests/snapshots/', import.meta.url); mkdirSync(output, { recursive: true });
for (const name of ['demo','table','diff','sequence','tree','timeline','layout','charts-v04','compare','architecture','components','titles','dashboard']) {
  const xml = readFileSync(new URL(`../examples/${name}.xml`, import.meta.url), 'utf8');
  for (const width of [40,80,120]) writeFileSync(new URL(`${name}-${width}.txt`,output),renderDocument(xml,width).plain().join('\n')+'\n');
}
console.log('Updated 39 renderer snapshots. Review before committing.');
