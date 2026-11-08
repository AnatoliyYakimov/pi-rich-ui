import { attr, integer } from './nodes.mjs';

const CONTENT=new Set('table diff chart graph sequence tree timeline metric progress flow bars list code sparkline'.split(' '));
const LAYOUT=new Set(['row','grid','col','grid-item','ui']);
export function rootWidth(node,available) {
  const room=Math.max(1,Math.min(240,Math.floor(available)||1)),requested=attr(node,'width');
  const budget=requested==='full'?room:Math.min(room,Math.max(112,Number(requested)||0));
  return Math.min(budget,integer(node,'maxWidth',240,1,240));
}
export function nodeWidth(node,available) {
  let width=Math.min(available,integer(node,'maxWidth',240,1,240));
  if(node.attrs.flex!==undefined && Number(node.attrs.flex)===0 && node.attrs.width!==undefined)
    width=Math.min(width,integer(node,'width',width,1,240));
  return Math.max(1,width);
}
export function panelFor(node,ctx) {
  if(!ctx.presentation)return null;
  const shell=ctx.root && node.tag==='ui';
  const explicit=LAYOUT.has(node.tag) && ['border','surface'].some(k=>node.attrs[k]!==undefined);
  if(!shell && !explicit && !(ctx.sections && CONTENT.has(node.tag)))return null;
  const attrs={border:'rounded',borderTone:'muted',titleTone:'text',surface:shell?'none':'subtle'};
  for(const k of ['border','borderTone','titleTone','surface','padding','density'])
    if(node.attrs[k]!==undefined)attrs[k]=node.attrs[k];
  if(shell && node.attrs.title!==undefined)attrs.title=node.attrs.title;
  return {attrs,shell};
}
