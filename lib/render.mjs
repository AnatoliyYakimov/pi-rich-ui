import { parseDocument, clean } from './parser.mjs';
import { Surface, vstack, textSurface, fit, wrap, widthOf, glyphWidth } from './surface.mjs';
import { roleOf, ownTone } from './theme.mjs';
import { icon, statusIcon } from './icons.mjs';
import { richText } from './rich-text.mjs';
import { renderChart, renderSparkline } from './charts.mjs';
import { renderRow, renderGrid, density } from './layout.mjs';
import { renderTable } from './table.mjs';
import { renderDiff } from './diff.mjs';
import { renderSequence } from './sequence.mjs';
import { renderTree } from './tree.mjs';
import { renderTimeline } from './timeline.mjs';
const children=n=>n.children.filter(x=>typeof x!=='string'||x.trim());
const elements=n=>n.children.filter(x=>typeof x!=='string');
const attr=(n,k,d='')=>n.attrs?.[k]??d;
const number=(n,k,d=0)=>{const v=Number(attr(n,k,d));return Number.isFinite(v)?v:d;};
const integer=(n,k,d,min=0,max=10)=>Math.max(min,Math.min(max,Math.floor(number(n,k,d))));
const text=n=>typeof n==='string'?n:n.children.map(text).join(' ');
const label=n=>clean(attr(n,'label',attr(n,'title',text(n)))).trim().replace(/\s+/g,' ');
const parsed=new Map();
export function getDocument(xml) {
  if(parsed.has(xml)){const a=parsed.get(xml);parsed.delete(xml);parsed.set(xml,a);return a;}
  const a=parseDocument(xml);parsed.set(xml,a);if(parsed.size>48)parsed.delete(parsed.keys().next().value);return a;
}
export function clearParseCache(){parsed.clear();}
function bars(n,w,ctx) {
  const bs=elements(n).filter(x=>x.tag==='bar');if(!bs.length)return textSurface('(no bars)',w,ctx);
  const nums=bs.map(b=>number(b,'value')),negative=nums.some(v=>v<0),max=Math.max(1,...nums.map(Math.abs));
  if(w<22)return vstack(bs.map((b,i)=>textSurface(`${label(b)}: ${nums[i]}`,w,ctx)),w,0,ctx.measure);
  const lw=Math.min(Math.floor(w*.32),Math.max(4,...bs.map(b=>widthOf(label(b))))),vw=Math.max(...nums.map(v=>String(v).length)),bw=Math.max(2,w-lw-vw-3);
  const out=new Surface(w,bs.length,ctx.measure),scale=negative?Math.max(1,Math.floor((bw-1)/2)):bw;
  bs.forEach((b,i)=>{
    const v=nums[i],fill=Math.round(Math.abs(v)/max*scale),origin=lw+1+(negative?scale:0);
    out.put(0,i,fit(label(b),lw,true,ctx.measure),'muted');
    if(negative)out.put(origin,i,'│','dim');
    out.put(v<0?origin-fill:origin+(negative?1:0),i,'█'.repeat(fill),roleOf(b,ctx,v<0?'error':'accent'));
    out.put(w-vw,i,String(v),'text',true);
  });return out;
}
function flow(n,w,ctx) {
  const nodes=elements(n).filter(x=>x.tag==='step');if(!nodes.length)return textSurface('(empty flow)',w,ctx);
  const sizes=nodes.map(x=>Math.max(7,Math.min(24,widthOf(label(x))+4))),horizontal=sizes.reduce((a,b)=>a+b,0)+4*(nodes.length-1)<=w && attr(n,'direction','LR')!=='TB';
  if(horizontal){const out=new Surface(w,3,ctx.measure);let x=0;nodes.forEach((node,i)=>{out.frame(x,0,sizes[i],3,roleOf(node,ctx));out.put(x+2,1,fit(label(node),sizes[i]-4,true,ctx.measure));if(i<nodes.length-1)out.put(x+sizes[i],1,' ─→ ','muted');x+=sizes[i]+4;});return out;}
  const parts=[];nodes.forEach((node,i)=>{const bw=Math.min(w,Math.max(10,Math.min(34,widthOf(label(node))+4))),lines=wrap(label(node),Math.max(1,bw-4),ctx.measure),box=new Surface(w,lines.length+2,ctx.measure);box.frame(0,0,bw,box.height,roleOf(node,ctx));lines.forEach((l,y)=>box.put(2,y+1,l));parts.push(box);if(i<nodes.length-1)parts.push(textSurface('  ↓',w,{...ctx,role:'muted'}));});return vstack(parts,w,0,ctx.measure);
}
function graph(n,w,ctx) {
  const ns=elements(n).filter(x=>x.tag==='node'),es=elements(n).filter(x=>x.tag==='edge');
  if(ns.length>48||es.length>96)throw Error('Graph limit: 48 nodes / 96 edges');
  const ids=new Map();ns.forEach(a=>{const id=String(attr(a,'id'));if(!id||ids.has(id))throw Error('Graph node IDs must be nonempty and unique');ids.set(id,a);});
  es.forEach(e=>{if(!ids.has(String(attr(e,'from')))||!ids.has(String(attr(e,'to'))))throw Error('Unknown graph endpoint');});
  if(!ns.length)return textSurface('(empty graph)',w,ctx);
  const deg=new Map([...ids.keys()].map(id=>[id,0])),rank=new Map([...ids.keys()].map(id=>[id,0]));
  es.forEach(e=>deg.set(String(attr(e,'to')),deg.get(String(attr(e,'to')))+1));
  const queue=[...ids.keys()].filter(id=>deg.get(id)===0),order=[];
  for(let i=0;i<queue.length;i++){const id=queue[i];order.push(id);for(const e of es.filter(e=>String(attr(e,'from'))===id)){const to=String(attr(e,'to'));rank.set(to,Math.max(rank.get(to),rank.get(id)+1));deg.set(to,deg.get(to)-1);if(deg.get(to)===0)queue.push(to);}}
  const fallback=()=>{
    const parts=[];for(const [id,node]of ids){parts.push(textSurface('● '+label(node),w,{...ctx,role:roleOf(node,ctx),bold:true}));for(const e of es.filter(e=>String(attr(e,'from'))===id)){const target=label(ids.get(String(attr(e,'to')))),lab=String(attr(e,'label'));parts.push(textSurface(`  └→ ${target}${lab?' · '+lab:''}`,w,ctx));}}
    return vstack(parts,w,0,ctx.measure);
  };
  if(order.length!==ns.length||w<30||ns.length>18)return fallback();
  const layers=Array.from({length:Math.max(...rank.values())+1},()=>[]);for(const id of order)layers[rank.get(id)].push(id);
  const bw=Math.min(22,Math.max(12,...ns.map(a=>widthOf(label(a))+4))),lr=attr(n,'direction','LR')!=='TB' && layers.length*bw+(layers.length-1)*6<=w;
  if(!lr && Math.max(...layers.map(a=>a.length))*12+(Math.max(...layers.map(a=>a.length))-1)*3>w)return fallback();
  const placements=new Map();let height=0;
  if(lr){height=Math.max(...layers.map(l=>l.length))*5-2;layers.forEach((l,ri)=>{const own=l.length*5-2,offset=Math.floor((height-own)/2);l.forEach((id,j)=>placements.set(id,{x:ri*(bw+6),y:offset+j*5,w:bw,h:3}));});}
  else {height=layers.length*6-3;layers.forEach((l,ri)=>{const each=Math.min(bw,Math.floor((w-3*(l.length-1))/l.length)),whole=l.length*each+(l.length-1)*3,start=Math.floor((w-whole)/2);l.forEach((id,j)=>placements.set(id,{x:start+j*(each+3),y:ri*6,w:each,h:3}));});}
  const legends=[];es.forEach((e,i)=>{const a=String(attr(e,'from')),b=String(attr(e,'to')),lab=String(attr(e,'label'));if(lab||rank.get(b)!==rank.get(a)+1)legends.push(`${label(ids.get(a))} → ${label(ids.get(b))}${lab?': '+lab:''}`);});
  const out=new Surface(w,height,ctx.measure);
  // Draw edges behind boxes. Long edges are represented in the exact endpoint legend.
  es.forEach(e=>{
    const aid=String(attr(e,'from')),bid=String(attr(e,'to'));if(rank.get(bid)!==rank.get(aid)+1)return;
    const a=placements.get(aid),b=placements.get(bid);
    const edgeRole=roleOf(e,{},'muted');
    if(lr){const x1=a.x+a.w,y1=a.y+1,x2=b.x-1,y2=b.y+1,m=x1+2;out.path([[x1,y1],[m,y1],[m,y2],[x2,y2]],edgeRole);out.put(x2,y2,'▶',edgeRole);}
    else {const x1=a.x+Math.floor(a.w/2),y1=a.y+a.h,x2=b.x+Math.floor(b.w/2),y2=b.y-1,m=y1+1;out.path([[x1,y1],[x1,m],[x2,m],[x2,y2]],edgeRole);out.put(x2,y2,'▼',edgeRole);}
  });
  for(const [id,p]of placements){const node=ids.get(id);out.fill(p.x,p.y,p.w,p.h,'panel');for(let r=0;r<p.h;r++)out.put(p.x,p.y+r,' '.repeat(p.w));out.frame(p.x,p.y,p.w,p.h,roleOf(node,ctx));out.put(p.x+2,p.y+1,fit(label(node),p.w-4,true,ctx.measure),'text',true);}
  if(!legends.length)return out;
  return vstack([out,textSurface(legends.join('\n'),w,{...ctx,role:'muted'})],w,1,ctx.measure);
}
function render(n,w,ctx) {
  w=Math.max(1,Math.min(240,Math.floor(w)||1));
  if(typeof n==='string')return textSurface(n.trim().replace(/\s+/g,' '),w,ctx);
  if (n.attrs.density && ['compact','normal','spacious'].includes(n.attrs.density)) ctx={...ctx,density:n.attrs.density};
  const kids=children(n),role=roleOf(n,ctx),childCtx=ownTone(n)?{...ctx,tone:ownTone(n)}:ctx;
  switch(n.tag) {
    case 'ui':case 'col':case 'grid-item':return vstack(kids.map(c=>render(c,w,childCtx)),w,integer(n,'gap',density(ctx).gap,0,3),ctx.measure);
    case 'row':return renderRow(n,w,childCtx,render);
    case 'grid':return renderGrid(n,w,childCtx,render);
    case 'box':case 'card':{
      if(w<8)return vstack([attr(n,'title')?textSurface(String(attr(n,'title')),w,{...ctx,bold:true}):null,...kids.map(c=>render(c,w,childCtx))],w,0,ctx.measure);
      const pad=integer(n,'padding',density(ctx).padding,0,2),inner=Math.max(1,w-2-pad*2),body=vstack(kids.map(c=>render(c,inner,childCtx)),inner,integer(n,'gap',density(ctx).gap,0,3),ctx.measure),out=new Surface(w,body.height+2,ctx.measure);
      out.fill(0,0,w,out.height,'panel');out.blit(body,1+pad,1);out.frame(0,0,w,out.height,roleOf(n,ctx,'border'),String(attr(n,'title')));return out;
    }
    case 'text':case 'title':case 'caption':return richText(n,w,ctx,{role:ownTone(n)??(n.tag==='caption'?'muted':n.tag==='title'?role:'text'),bold:n.tag==='title'});
    case 'badge':return textSurface((attr(n,'icon')?icon(attr(n,'icon')):statusIcon(role))+' '+label(n),w,{...ctx,role,bold:true});
    case 'icon':return textSurface(icon(attr(n,'name')),w,{...ctx,role});
    case 'divider':return textSurface('─'.repeat(w),w,{...ctx,role:ownTone(n)??'border'});
    case 'spacer':return new Surface(w,integer(n,'size',1,1,3),ctx.measure);
    case 'metric':{
      const parts=[textSurface(label(n),w,{...ctx,role:'muted'}),textSurface(String(attr(n,'value','—'))+(attr(n,'unit')?' '+attr(n,'unit'):''),w,{...ctx,role,bold:true})];
      if(attr(n,'hint'))parts.push(textSurface(String(attr(n,'hint')),w,{...ctx,role:'dim'}));return vstack(parts,w,0,ctx.measure);
    }
    case 'progress':{
      const val=number(n,'value'),max=Math.max(Number.EPSILON,number(n,'max',100)),r=Math.max(0,Math.min(1,val/max)),percent=`${Math.round(r*100)}%`,out=new Surface(w,2,ctx.measure),barw=Math.max(1,w-percent.length-2),units=Math.round(r*barw*8),full=Math.floor(units/8),tail=units%8;
      out.put(0,0,fit(label(n),w,true,ctx.measure),'muted');out.put(0,1,'━'.repeat(barw),'dim');out.put(0,1,'█'.repeat(full)+(tail?'▏▎▍▌▋▊▉'[tail-1]:''),role);out.put(Math.max(0,w-percent.length),1,percent,'text',true);return out;
    }
    case 'flow':return flow(n,w,childCtx);
    case 'graph':return graph(n,w,childCtx);
    case 'bars':return bars(n,w,childCtx);
    case 'chart':return renderChart(n,w,childCtx);
    case 'sparkline':return renderSparkline(n,w,childCtx);
    case 'table':return renderTable(n,w,childCtx,render);
    case 'diff':return renderDiff(n,w,childCtx);
    case 'sequence':return renderSequence(n,w,childCtx);
    case 'tree':return renderTree(n,w,childCtx);
    case 'timeline':return renderTimeline(n,w,childCtx,render);
    case 'list':return vstack(kids.map(c=>textSurface('• '+label(c),w,{...ctx,role:roleOf(c,childCtx,'text')})),w,0,ctx.measure);
    case 'code':return textSurface(text(n).trim(),w,{...ctx,role:'muted'});
    default:return textSurface(label(n),w,ctx);
  }
}
export function renderDocument(xmlOrAst,width=80,{measure=glyphWidth,monochrome=false}={}) {
  const ast=typeof xmlOrAst==='string'?getDocument(xmlOrAst):xmlOrAst;
  return render(ast,width,{measure,monochrome});
}
export class RichComponent {
  constructor(xml,options={}){this.xml=xml;this.options=options;}
  render(width){return renderDocument(this.xml,width,{...this.options,monochrome:this.options.colors===false||this.options.colorMode==='none'}).ansi(this.options);}
  invalidate(){} // No rendered-line cache; Pi owns block/theme/resize caching.
}
