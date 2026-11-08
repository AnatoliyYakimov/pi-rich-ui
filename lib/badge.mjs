import { Surface, wrap } from './surface.mjs';
import { attr, label, measureText } from './nodes.mjs';
import { roleOf, surfaceRole } from './theme.mjs';
import { icon, statusIcon } from './icons.mjs';

export function badgeContent(node, ctx = {}) {
  const role=roleOf(node,ctx), requested=surfaceRole(attr(node,'surface','auto'));
  const background=requested==='auto'?(['success','warning','error','info'].includes(role)?role:'subtle'):requested;
  return {text:(attr(node,'icon')?icon(attr(node,'icon')):statusIcon(role))+' '+label(node),role,background};
}
export function renderBadge(node,width,ctx) {
  const {text,role,background}=badgeContent(node,ctx), pad=width>=4?1:0;
  const lines=wrap(text,Math.max(1,width-2*pad),ctx.measure),out=new Surface(width,lines.length,ctx.measure);
  lines.forEach((line,y)=>{
    out.background(0,y,Math.min(width,measureText(line,ctx)+2*pad),1,background);
    out.put(pad,y,line,background==='none'?role:'text',true);
    if(y===0)out.put(pad,y,[...line][0],role,true);
  });
  return out;
}
