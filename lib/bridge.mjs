import { LANGUAGE } from './parser.mjs';
const KEY=Symbol.for('pi-rich-ui.inline-markdown-bridge.v2');
/**
 * INTERNAL ABI adapter, not a supported Pi API. It only handles our display-only
 * sentinel code tokens; all other tokens delegate unchanged. No files are patched.
 * Kept isolated so a future public Markdown-node hook can replace it.
 */
export function installBridge(Markdown, renderer) {
  const proto=Markdown?.prototype;
  if(!proto || typeof proto.renderToken!=='function' || typeof proto.render!=='function')
    return {ok:false,reason:'Markdown.renderToken ABI unavailable',release(){}};
  let state=proto[KEY];
  if(!state || proto.renderToken!==state.wrapper){
    const original=proto.renderToken;
    state={original,owners:new Map(),wrapper:null};
    state.wrapper=function(token,width,...rest){
      if(token?.type==='code' && token.lang===LANGUAGE && typeof token.text==='string'){
        const active=[...state.owners.values()].at(-1);
        if(active)try {const lines=active(token.text,width,this,token);if(Array.isArray(lines)&&lines.every(s=>typeof s==='string'))return lines;}catch {/* Fail closed: ordinary code rendering. */}
      }
      return original.call(this,token,width,...rest);
    };
    Object.defineProperty(proto,KEY,{value:state,configurable:true});proto.renderToken=state.wrapper;
  }
  const owner={};state.owners.set(owner,renderer);
  return {ok:true,reason:'guarded internal Markdown.renderToken adapter',release(){
    state.owners.delete(owner);
    if(!state.owners.size && proto.renderToken===state.wrapper){proto.renderToken=state.original;if(proto[KEY]===state)delete proto[KEY];}
  }};
}
export function probeBridge(Markdown) {
  const id=s=>s,theme=Object.fromEntries('heading link linkUrl code codeBlock codeBlockBorder quote quoteBorder hr listBullet bold italic strikethrough underline'.split(' ').map(k=>[k,id]));
  try {
    const probe=new Markdown('```'+LANGUAGE+'\n<Metric label="rich-probe" value={7}/>\n```',0,0,theme);
    const lines=probe.render(40).join('\n');
    return lines.includes('rich-probe') && !lines.includes('<Metric') && !lines.includes(LANGUAGE) && !lines.includes('```');
  }catch{return false;}
}
