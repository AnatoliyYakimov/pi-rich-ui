import { clean } from './parser.mjs';
import { Surface,graphemes } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { icon } from './icons.mjs';
import { badgeContent } from './badge.mjs';
/** Inline spans retain word/style boundaries; badge padding is an atomic part of its pill. */
export function richText(node,width,ctx,{role='text',bold=false}={}) {
  const runs=[];
  function collect(n,r,b){
    if(typeof n==='string'){runs.push({text:clean(n),role:r,bold:b});return;}
    r=ownTone(n)??r;b=n.attrs?.bold===undefined?b:n.attrs.bold!==false&&n.attrs.bold!=='false';
    if(n.tag==='icon'){runs.push({text:icon(n.attrs.name),role:r,bold:b});return;}
    if(n.tag==='badge'){
      const badge=badgeContent(n,{...ctx,tone:r});
      runs.push({text:' '+badge.text+' ',role:badge.background==='none'?r:'text',bold:true,background:badge.background,iconRole:badge.role,atomic:true});return;
    }
    if(n.attrs?.label && !n.children.length)runs.push({text:String(n.attrs.label),role:r,bold:b});
    for(const c of n.children)collect(c,r,b);
  }
  collect(node,role,bold);
  const words=[];let word=[];
  const flush=()=>{if(word.length){words.push(word);word=[];}};
  for(const r of runs){
    if(r.atomic)flush();
    for(const [i,g] of graphemes(r.text).entries()){
      if(/\s/u.test(g)&&!r.atomic)flush();
      else word.push({...r,g,role:r.atomic&&i===1?r.iconRole:r.role,w:ctx.measure(g)});
    }
    if(r.atomic)flush();
  }
  flush();
  const lines=[[]];let used=0;
  for(const original of words){
    const ws=original.map(c=>c.w>width?{...c,g:'�',w:1}:c).filter(c=>c.w>0),ww=ws.reduce((s,c)=>s+c.w,0);
    if(used && used+1+ww<=width){lines.at(-1).push({g:' ',w:1,role:'text'});used++;}
    else if(used){lines.push([]);used=0;}
    for(const c of ws){if(used+c.w>width){lines.push([]);used=0;}lines.at(-1).push(c);used+=c.w;}
  }
  const align=node.attrs?.align??'left';
  if(!['left','center','right'].includes(align))throw Error('text align must be left, center, or right');
  const out=new Surface(width,lines.length,ctx.measure);
  lines.forEach((line,y)=>{
    const size=line.reduce((s,c)=>s+c.w,0);
    let x=align==='right'?width-size:align==='center'?Math.floor((width-size)/2):0;
    for(const c of line){out.put(x,y,c.g,c.role,c.bold,undefined,c.background==='none'?undefined:c.background);x+=c.w;}
  });
  return out;
}
