/** Run locally against the exact pi-tui installed with your Pi, never a bundled second copy. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { installBridge, probeBridge } from '../lib/bridge.mjs';
import { NativeRenderer } from '../lib/native.mjs';
import { transformMarkdown } from '../lib/parser.mjs';
async function loadHost(){
  const explicit=process.argv[2]||process.env.PI_TUI_MODULE;
  if(explicit)return import(explicit.startsWith('file:')?explicit:pathToFileURL(explicit).href);
  try{return await import('@earendil-works/pi-tui');}catch{}
  const root=execFileSync(process.platform==='win32'?'npm.cmd':'npm',['root','-g'],{encoding:'utf8'}).trim();
  const require=createRequire(join(root,'@earendil-works/pi-coding-agent/package.json'));
  return import(pathToFileURL(require.resolve('@earendil-works/pi-tui')).href);
}
let tui;
try{tui=await loadHost();}catch(e){console.error('Cannot find the host pi-tui. Run where Pi is installed, or pass its dist/index.js path.\n'+e.message);process.exit(2);}
const native=new NativeRenderer(tui,{colors:false}),bridge=installBridge(tui.Markdown,(xml,w,_md,token)=>native.render(xml,w,{owner:token}));
assert.equal(bridge.ok,true,bridge.reason);assert.equal(probeBridge(tui.Markdown),true,'Actual Markdown ABI probe failed');
const identity=s=>s,theme=Object.fromEntries('heading link linkUrl code codeBlock codeBlockBorder quote quoteBorder hr listBullet bold italic strikethrough underline'.split(' ').map(k=>[k,identity]));
for(const name of ['demo','table','diff','sequence','tree','timeline','layout','charts-v04']) {
 const xml=readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8');
 const md=new tui.Markdown('Before\n\n'+xml+'\n\nAfter',1,0,theme,undefined,{transform:s=>transformMarkdown(s)});
 for(const width of [24,40,80,120]){
   md.invalidate();const lines=md.render(width),text=lines.join('\n');
   assert.ok(text.includes('Before')&&text.includes('After'),`${name}: prose lost`);
   assert.ok(!text.includes('<UI>')&&!text.includes('__pi_rich_ui'),`${name}: adapter did not run`);
   assert.ok(lines.every(s=>tui.visibleWidth(s)<=width),`${name}: width overflow`);
 }
}
const literal='```xml\n<Box>literal</Box>\n```';
const control=new tui.Markdown(literal,0,0,theme,undefined,{transform:s=>transformMarkdown(s)});
assert.ok(control.render(80).join('\n').includes('<Box>literal</Box>'));
bridge.release();console.log('PASS: actual host Markdown, 8 v0.4 examples, width/resize and fenced-code isolation.');
