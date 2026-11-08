import { readFileSync } from 'node:fs';
import { transformMarkdown,fenced } from './parser.mjs';
import { injectGuidance,SYSTEM_GUIDE } from './prompt.mjs';
import { installBridge,probeBridge } from './bridge.mjs';
import { NativeRenderer } from './native.mjs';
import { renderDocument,clearParseCache } from './render.mjs';
import { detectColorMode } from './theme.mjs';
import { createFeedbackHandler } from './feedback.mjs';
const {version:VERSION}=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
export async function setup(pi,tui,{env=process.env,probe=true}={}) {
  const mode=env.PI_RICH_UI_RENDER==='text'?'text':'ansi',colorMode=detectColorMode(env);
  let ctx,bridge={ok:false,reason:'not initialized',release(){}},disposed=false,userRun=false;
  const hasTransformer=typeof pi.registerMarkdownTransformer==='function';
  const guidanceEnabled=c=>hasTransformer&&(c.mode?c.mode==='tui':c.hasUI===true)&&env.PI_RICH_UI_PROMPT!=='0';
  const feedback=createFeedbackHandler({
    enabled:c=>!disposed&&userRun&&guidanceEnabled(c)&&env.PI_RICH_UI_REPAIR!=='0',
    notify:(c,message,severity)=>c.ui?.notify?.(message,severity),
  });
  const renderer=new NativeRenderer(tui,{getTheme:()=>ctx?.ui?.theme,colors:colorMode!=='none',colorMode});
  const activate=()=>{
    if(bridge.ok||mode==='text'||!hasTransformer)return;
    bridge=installBridge(tui.Markdown,(xml,width)=>renderer.render(xml,width));
    if(bridge.ok&&probe&&!probeBridge(tui.Markdown)){bridge.release();bridge={ok:false,reason:'Markdown ABI smoke check failed',release(){}};}
  };
  activate();
  if(hasTransformer)pi.registerMarkdownTransformer((markdown,c)=>{
    if(disposed||c.messageType!=='assistant')return markdown;
    return transformMarkdown(markdown,{isStreaming:!!c.isStreaming,replace:xml=>{
      if(bridge.ok)return fenced(xml);
      try{return fenced(renderDocument(xml,Math.max(1,(c.availableWidth??80)-4),{monochrome:true}).plain().join('\n'),'text');}catch{return xml;}
    }});
  },{messageTypes:['assistant']});
  pi.on('session_start',(_e,c)=>{
    ctx=c;disposed=false;userRun=false;
    if(c.mode&&c.mode!=='tui'){bridge.release();bridge={ok:false,reason:'non-TUI mode',release(){}};return;}
    activate();
    if(!hasTransformer)c.ui?.notify?.('Rich UI disabled: this Pi lacks registerMarkdownTransformer.','warning');
    else if(!bridge.ok&&mode!=='text')c.ui?.notify?.(`Rich UI: text fallback (${bridge.reason}).`,'warning');
    if(['auto','image'].includes(env.PI_RICH_UI_RENDER))c.ui?.notify?.(`Rich UI ${VERSION}: PNG is disabled; using ANSI. Remove the legacy PI_RICH_UI_RENDER setting.`,'info');
  });
  pi.on('before_agent_start',(event,c)=>{ctx=c;userRun=event.messageType==='user';return injectGuidance(event,guidanceEnabled(c));});
  // Consumed steering/follow-up messages can enter a custom-started run without another before_agent_start.
  pi.on('message_end',event=>{if(event.message?.role==='user')userRun=true;});
  pi.on('agent_before_settle',feedback);
  pi.on('session_shutdown',()=>{disposed=true;userRun=false;bridge.release();bridge={ok:false,reason:'shutdown',release(){}};renderer.clear();clearParseCache();ctx=undefined;});
  if(typeof pi.registerEntryRenderer==='function')pi.registerEntryRenderer('pi-rich-ui-demo',(entry,_options,theme)=>({
    render(width){const xml=entry.data?.xml;if(typeof xml!=='string')return ['Rich UI demo missing'];try{return renderer.render(xml,width,{theme});}catch(e){return ['Rich UI: '+String(e.message)];}},invalidate(){renderer.clear();}
  }));
  pi.registerCommand('rich-ui',{
    description:'Rich UI: demo | layers | boundaries | workflow | decisions | compare | architecture | components | titles | dashboard | table | diff | sequence | tree | timeline | layout | charts | palette | status | prompt (no model request)',
    handler:async(args,c)=>{
      ctx=c;const cmd=args.trim()||'status';
      if(['demo','layers','boundaries','workflow','decisions','compare','architecture','components','titles','dashboard','palette','charts','table','diff','sequence','tree','timeline','layout'].includes(cmd)){
        if(c.mode&&c.mode!=='tui'){c.ui?.notify?.('Demo requires TUI mode.','warning');return;}
        if(typeof pi.registerEntryRenderer!=='function'){c.ui?.notify?.('This Pi lacks custom-entry rendering. Use npm run preview.','warning');return;}
        const name=cmd==='demo'?'layers':cmd==='charts'?'charts-v04':cmd;
        pi.appendEntry('pi-rich-ui-demo',{xml:readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8')});return;
      }
      if(cmd==='prompt'){c.ui?.notify?.(SYSTEM_GUIDE,'info');return;}
      if(cmd!=='status'){c.ui?.notify?.('Usage: /rich-ui [demo|layers|boundaries|workflow|decisions|compare|architecture|components|titles|dashboard|table|diff|sequence|tree|timeline|layout|charts|palette|status|prompt]','info');return;}
      c.ui?.notify?.(`Rich UI ${VERSION} · ${bridge.ok?'native ANSI':'text fallback'} · colors=${colorMode==='none'?'off':c.ui?.theme?'Pi theme':colorMode} · charts=Braille · PNG=off · prompt=${env.PI_RICH_UI_PROMPT==='0'?'off':'on'} · repair=${guidanceEnabled(c)&&env.PI_RICH_UI_REPAIR!=='0'?'configured (Pi 1.5.0+)':'off'}\n${bridge.reason}`,'info');
    }
  });
  return {renderer,get bridge(){return bridge;}};
}
