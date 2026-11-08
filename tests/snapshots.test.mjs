import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderDocument } from '../lib/render.mjs';
for(const name of ['demo','table','diff','sequence','tree','timeline','layout','charts-v04'])test(`${name}: reviewed renderer snapshots at 40/80/120 columns`,()=>{
 const xml=readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8');
 for(const width of [40,80,120]){
  const expected=readFileSync(new URL(`./snapshots/${name}-${width}.txt`,import.meta.url),'utf8');
  assert.equal(renderDocument(xml,width).plain().join('\n')+'\n',expected,`${name} width ${width}`);
 }
});
