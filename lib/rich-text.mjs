import { clean } from './parser.mjs';
import { Surface,graphemes } from './surface.mjs';
import { ownTone } from './theme.mjs';
import { icon,statusIcon } from './icons.mjs';
/** Inline spans inside Text/Title/Caption: word wrapping retains style boundaries. */
export function richText(node,width,ctx,{role='text',bold=false}={}) {
  const runs=[];
  function collect(n,r,b){
    if(typeof n==='string'){runs.push({text:clean(n),role:r,bold:b});return;}
    r=ownTone(n)??r;b=n.attrs?.bold===undefined?b:n.attrs.bold!==false&&n.attrs.bold!=='false';
    if(n.tag==='icon'){runs.push({text:icon(n.attrs.name),role:r,bold:b});return;}
    if(n.tag==='badge')runs.push({text:statusIcon(r)+' ',role:r,bold:true});
    if(n.attrs?.label && !n.children.length)runs.push({text:String(n.attrs.label),role:r,bold:b});
    for(const c of n.children)collect(c,r,b);
  }
  collect(node,role,bold);
  const words=[];let word=[];
  for(const r of runs)for(const g of graphemes(r.text)){
    if(/\s/u.test(g)){if(word.length){words.push(word);word=[];}}
    else word.push({g,...r,w:ctx.measure(g)});
  }
  if(word.length)words.push(word);
  const lines=[[]];let used=0;
  for(const original of words){
    const ws=original.map(c=>c.w>width?{...c,g:'�',w:1}:c).filter(c=>c.w>0),ww=ws.reduce((s,c)=>s+c.w,0);
    if(used && (used+1+ww<=width)){lines.at(-1).push({g:' ',w:1,role:'text'});used++;}
    else if(used){lines.push([]);used=0;}
    for(const c of ws){if(used+c.w>width){lines.push([]);used=0;}lines.at(-1).push(c);used+=c.w;}
  }
  const out=new Surface(width,lines.length,ctx.measure);
  lines.forEach((line,y)=>{let x=0;for(const c of line){out.put(x,y,c.g,c.role,c.bold);x+=c.w;}});
  return out;
}
