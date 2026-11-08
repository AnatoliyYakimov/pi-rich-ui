import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { renderDocument } from '../lib/render.mjs';
const xml=readFileSync(new URL('../examples/demo.xml',import.meta.url),'utf8');
const results=[];
for(const width of [40,80,120]){
  for(let i=0;i<10;i++)renderDocument(xml,width).ansi();
  const samples=[];
  for(let i=0;i<100;i++){const start=performance.now();renderDocument(xml,width).ansi();samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);
  results.push({width,runs:samples.length,medianMs:+samples[50].toFixed(3),p95Ms:+samples[95].toFixed(3)});
}
console.log(JSON.stringify({node:process.version,platform:process.platform,benchmark:'cached parse + layout + ANSI; synthetic, not live Pi',results},null,2));
