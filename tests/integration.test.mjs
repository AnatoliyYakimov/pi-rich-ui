import test from 'node:test';
import assert from 'node:assert/strict';
import { installBridge } from '../lib/bridge.mjs';
import { LANGUAGE } from '../lib/parser.mjs';
import { injectGuidance,SYSTEM_GUIDE } from '../lib/prompt.mjs';
import { setup } from '../lib/extension.mjs';
import { NativeRenderer } from '../lib/native.mjs';
const fakeClass=()=>class {render(){return [];}renderToken(t,w){return [`original:${t.text}:${w}`];}};
test('system guidance is injected exactly once into structured options',()=>{const e={systemPromptOptions:{promptGuidelines:['Existing']}};injectGuidance(e);injectGuidance(e);assert.deepEqual(e.systemPromptOptions.promptGuidelines,['Existing',SYSTEM_GUIDE]);});
test('legacy prompt injection preserves existing text and deduplicates',()=>{const r=injectGuidance({systemPrompt:'Existing'});assert.ok(r.systemPrompt.startsWith('Existing\n'));assert.equal(injectGuidance(r),undefined);});
test('disabled prompt injection is a no-op',()=>{const e={systemPromptOptions:{promptGuidelines:[]}};injectGuidance(e,false);assert.equal(e.systemPromptOptions.promptGuidelines.length,0);});
test('bridge delegates every normal token unchanged',()=>{const M=fakeClass(),before=M.prototype.renderToken,bridge=installBridge(M,()=>['native']);assert.deepEqual(new M().renderToken({type:'paragraph',text:'hello'},80),['original:hello:80']);assert.deepEqual(new M().renderToken({type:'code',lang:LANGUAGE,text:'x'},80),['native']);bridge.release();assert.equal(M.prototype.renderToken,before);});
test('bridge owner lifecycle does not double-wrap or clobber another owner',()=>{const M=fakeClass(),orig=M.prototype.renderToken,b1=installBridge(M,()=>['one']),wrapped=M.prototype.renderToken,b2=installBridge(M,()=>['two']);assert.equal(M.prototype.renderToken,wrapped);b1.release();assert.deepEqual(new M().renderToken({type:'code',lang:LANGUAGE,text:'x'},80),['two']);b2.release();assert.equal(M.prototype.renderToken,orig);});
test('bridge errors safely delegate, rather than breaking transcript',()=>{const M=fakeClass(),b=installBridge(M,()=>{throw Error('oops');});assert.deepEqual(new M().renderToken({type:'code',lang:LANGUAGE,text:'x'},20),['original:x:20']);b.release();});
test('missing internal ABI is a supported fallback',()=>assert.equal(installBridge(class{},()=>[]).ok,false));
function host(){const hooks=new Map(),commands=new Map(),entries=[],renderers=new Map();const pi={on:(k,h)=>hooks.set(k,h),registerMarkdownTransformer(f){this.transform=f;},registerCommand:(k,h)=>commands.set(k,h),appendEntry:(t,d)=>entries.push({t,d}),registerEntryRenderer:(t,f)=>renderers.set(t,f)};return {pi,hooks,commands,entries,renderers};}
const context={mode:'tui',hasUI:true,ui:{theme:{appearance:'dark'},notify(){}}};
test('extension transforms only assistant text and leaves input unchanged',async()=>{const h=host(),api=await setup(h.pi,{Markdown:fakeClass()},{probe:false,env:{}});const xml='<Metric label="RPS" value={600}/>';assert.equal(h.pi.transform(xml,{messageType:'user'}),xml);assert.match(h.pi.transform(xml,{messageType:'assistant',availableWidth:80}),new RegExp(LANGUAGE));h.hooks.get('session_shutdown')();assert.equal(api.bridge.ok,false);});
test('extension skips prompt injection in RPC / print / JSON modes',async()=>{const h=host();await setup(h.pi,{Markdown:fakeClass()},{probe:false,env:{}});for(const mode of ['rpc','print','json']){const e={systemPromptOptions:{promptGuidelines:[]}};h.hooks.get('before_agent_start')(e,{...context,mode});assert.equal(e.systemPromptOptions.promptGuidelines.length,0);}h.hooks.get('session_shutdown')();});
test('extension demo creates display-only session entry, no user/model message',async()=>{const h=host();await setup(h.pi,{Markdown:fakeClass()},{probe:false,env:{}});await h.commands.get('rich-ui').handler('demo',context);assert.equal(h.entries.length,1);assert.equal(h.entries[0].t,'pi-rich-ui-demo');assert.match(h.entries[0].d.xml,/<UI>/);h.hooks.get('session_shutdown')();});
test('text mode uses public transformer fallback',async()=>{const h=host();await setup(h.pi,{}, {probe:false,env:{PI_RICH_UI_RENDER:'text'}});const r=h.pi.transform('<Metric label="RPS" value={600}/>',{messageType:'assistant',availableWidth:40});assert.match(r,/```text/);assert.ok(!r.includes(LANGUAGE));h.hooks.get('session_shutdown')();});
test('legacy image/auto variables use ANSI and never construct images',async()=>{
  for(const mode of ['image','auto']){
    const h=host(),notices=[];
    const api=await setup(h.pi,{Markdown:fakeClass(),Image:class{constructor(){throw Error('image forbidden');}}},{env:{PI_RICH_UI_RENDER:mode},probe:false});
    h.hooks.get('session_start')({}, {...context,ui:{...context.ui,notify:m=>notices.push(m)}});
    assert.match(notices.join(' '),/PNG is disabled/);
    const output=api.renderer.render('<Chart values="1,4,2"/>',50).join('\n');
    assert.match(output,/[\u2801-\u28ff]/);assert.ok(!/\x1b_G|1337;File/.test(output));h.hooks.get('session_shutdown')();
  }
});
test('palette/charts commands create display-only entries',async()=>{
  const h=host();await setup(h.pi,{Markdown:fakeClass()},{probe:false,env:{}});
  for(const cmd of ['palette','charts'])await h.commands.get('rich-ui').handler(cmd,context);
  assert.equal(h.entries.length,2);assert.ok(h.entries.every(x=>x.t==='pi-rich-ui-demo'));
  h.hooks.get('session_shutdown')();
});
test('NO_COLOR causes stacked chart layout rather than indistinguishable color-only series',()=>{
  const xml='<Chart><Series label="First" values="1,3,2"/><Series label="Second" values="3,1,2"/></Chart>';
  const native=new NativeRenderer({},{colors:false});const result=native.render(xml,60).join('\n');
  assert.ok(!result.includes('\x1b'));assert.match(result,/First/);assert.match(result,/Second/);assert.equal((result.match(/└/g)||[]).length,2);
});
test('native renderer uses current theme at every call without stale rendered cache',()=>{
  let token='old';const native=new NativeRenderer({},{getTheme:()=>({fg:(_k,s)=>token+s})});
  assert.match(native.render('<Text>ok</Text>',20).join(''),/old/);token='new';assert.match(native.render('<Text>ok</Text>',20).join(''),/new/);
});
test('compact guide documents color roles and Braille series without excessive instruction length',()=>{
  assert.ok(SYSTEM_GUIDE.length<2300);assert.match(SYSTEM_GUIDE,/success\|error\|warning/);assert.match(SYSTEM_GUIDE,/<Series/);
});
test('v0.4 commands create all new display-only examples with no model request',async()=>{
 const h=host();await setup(h.pi,{Markdown:fakeClass()},{probe:false,env:{}});
 for(const cmd of ['table','diff','sequence','tree','timeline','layout','charts'])await h.commands.get('rich-ui').handler(cmd,context);
 assert.equal(h.entries.length,7);assert.ok(h.entries.every(e=>e.t==='pi-rich-ui-demo'));
 for(const e of h.entries){const view=h.renderers.get(e.t)({data:e.d},{},context.ui.theme);assert.ok(view.render(80).length>0);}
 h.hooks.get('session_shutdown')();
});
test('v0.4 guide mentions every new component and contains valid XML examples',()=>{
 for(const t of ['Table.Column','Diff','Sequence','Tree','Timeline','Rule','GridItem'])assert.ok(SYSTEM_GUIDE.includes(t));
 const native=new NativeRenderer({},{colors:false});
 for(const line of SYSTEM_GUIDE.split('\n').filter(l=>l.startsWith('<')))assert.doesNotThrow(()=>native.render(line,80));
});
test('session shutdown/start reinstalls the bridge without duplicate wrappers',async()=>{
 const h=host(),M=fakeClass(),orig=M.prototype.renderToken;await setup(h.pi,{Markdown:M},{probe:false,env:{}});
 h.hooks.get('session_shutdown')();assert.equal(M.prototype.renderToken,orig);
 h.hooks.get('session_start')({},context);assert.notEqual(M.prototype.renderToken,orig);
 assert.match(h.pi.transform('<Timeline><Step label="x"/></Timeline>',{messageType:'assistant'}),new RegExp(LANGUAGE));
 h.hooks.get('session_shutdown')();assert.equal(M.prototype.renderToken,orig);
});
