import { Surface,fit,textSurface,vstack,wrap,graphemes } from './surface.mjs';
import { roleOf,ownTone } from './theme.mjs';
const attr=(n,k,d='')=>n.attrs?.[k]??d;
const children=n=>n.children.filter(x=>typeof x!=='string');
const bool=(n,k,d)=>n.attrs?.[k]===undefined?d:![false,'false','0',0].includes(n.attrs[k]);
const integer=(n,k,d,min,max)=>{const x=Number(attr(n,k,d));return Number.isFinite(x)?Math.max(min,Math.min(max,Math.floor(x))):d;};
const caption=n=>String(attr(n,'label',attr(n,'title','')));
const DEFAULT_ROLES=['info','cyan','purple','accent'];
/** A single terminal glyph contains two columns by four rows of Braille dots. */
export const DOTS=Object.freeze([Object.freeze([1,8]),Object.freeze([2,16]),Object.freeze([4,32]),Object.freeze([64,128])]);
export class BrailleCanvas {
  constructor(columns,rows) {
    if(!Number.isInteger(columns)||!Number.isInteger(rows)||columns<1||columns>240||rows<1||rows>16)throw Error('Braille canvas size out of bounds');
    this.columns=columns;this.rows=rows;this.width=columns*2;this.height=rows*4;this.cells=new Map();
  }
  dot(x,y,role='accent',series=0) {
    x=Math.round(x);y=Math.round(y);
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=this.width||y<0||y>=this.height)return;
    const key=Math.floor(y/4)*this.columns+Math.floor(x/2),old=this.cells.get(key)??{mask:0,role,series:new Set()};
    old.mask|=DOTS[y%4][x%2];old.series.add(series);
    if(old.series.size>1)old.role='text'; // A glyph has only one foreground: never falsely assign merged dots to one series.
    this.cells.set(key,old);
  }
  line(a,b,role,series=0,dashed=false) {
    // Caller scales/clips coordinates. Reject unbounded input rather than walking huge lines.
    if([...a,...b].some(v=>!Number.isInteger(v))||a[0]<0||a[0]>=this.width||b[0]<0||b[0]>=this.width||a[1]<0||a[1]>=this.height||b[1]<0||b[1]>=this.height)throw Error('Braille line outside viewport');
    let [x,y]=a;const [tx,ty]=b,dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let err=dx+dy;
    for(;;){if(!dashed||Math.floor((x+y)/3)%2===0)this.dot(x,y,role,series);if(x===tx&&y===ty)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
  }
  get overlaps(){return [...this.cells.values()].some(c=>c.series.size>1);}
  draw(surface,x=0,y=0){for(const [key,c]of this.cells)surface.put(x+key%this.columns,y+Math.floor(key/this.columns),String.fromCodePoint(0x2800+c.mask),c.role);}
}
export function readValues(node) {
  const source=String(attr(node,'values','')).trim();
  if(!source || /(?:^|[,;])\s*(?:[,;]|$)/.test(source))throw Error('Chart needs numeric values; use null for missing samples');
  const raw=source.split(/[\s,;]+/);
  if(raw.length>512)throw Error('Chart limit: 512 samples per series');
  return raw.map(v=>{
    if(/^(null|_)$/i.test(v))return null;
    const x=Number(v);
    if(!Number.isFinite(x)||Math.abs(x)>1e15)throw Error('Chart values must be finite and within ±1e15');
    return x;
  });
}
export const format=x=>{
  if(x===0)return '0';
  const a=Math.abs(x);
  if(a>=1e9 || a<.001)return x.toExponential(1).replace('e+','e');
  if(a>=1e6)return `${+(x/1e6).toPrecision(3)}M`;
  if(a>=1e3)return `${+(x/1e3).toPrecision(3)}k`;
  return String(+x.toPrecision(3));
};
function numericAttribute(node,key,defaultValue){
  if(node.attrs?.[key]===undefined)return defaultValue;
  const x=Number(node.attrs[key]);
  if(!Number.isFinite(x)||Math.abs(x)>1e15)throw Error(`Chart ${key} must be finite and within ±1e15`);
  return x;
}
/** Optional nice boundaries; explicit user limits are never overwritten. */
export function niceScale(min,max) {
  const rough=(max-min)/4;
  if(!Number.isFinite(rough)||rough<=0)return {min,max};
  const power=10**Math.floor(Math.log10(rough));
  if(!power)return {min,max};
  const step=([1,2,2.5,5,10].find(f=>f*power>=rough)??10)*power;
  return {min:+(Math.floor(min/step)*step).toPrecision(12),max:+(Math.ceil(max/step)*step).toPrecision(12)};
}
export function chartStats(values) {
  const data=values.filter(v=>v!==null);
  return {min:data.length?Math.min(...data):null,max:data.length?Math.max(...data):null,last:[...values].reverse().find(v=>v!==null)??null};
}
export function chartData(node,ctx={}) {
  let series=children(node).filter(x=>x.tag==='series');
  if(!series.length)series=[node];
  if(series.length>4)throw Error('Chart limit: four series');
  const data=series.map(readValues),all=data.flat().filter(v=>v!==null);
  if(!all.length)throw Error('Chart needs at least one finite sample');
  const zero=bool(node,'zero',true),autoMin=Math.min(...all,...(zero?[0]:[])),autoMax=Math.max(...all,...(zero?[0]:[]));
  let min=numericAttribute(node,'min',autoMin),max=numericAttribute(node,'max',autoMax);
  if(min===max && node.attrs.min===undefined && node.attrs.max===undefined){const pad=Math.max(1,Math.abs(min)*.05);min-=pad;max+=pad;}
  if(max<=min)throw Error('Chart max must be greater than min');
  if(bool(node,'nice',false)) {const scale=niceScale(min,max);if(node.attrs.min===undefined)min=scale.min;if(node.attrs.max===undefined)max=scale.max;}
  const roles=series.map((s,i)=>roleOf(s,{tone:ownTone(node)??ctx.tone},DEFAULT_ROLES[i]));
  const length=Math.max(...data.map(d=>d.length));
  let x;
  if(node.attrs.x!==undefined){
    x=readValues({attrs:{values:node.attrs.x}});
    if(x.length!==length||x.some((v,i)=>v===null||(i>0&&v<=x[i-1])))throw Error('Chart x must contain one strictly increasing numeric coordinate per sample index');
  }
  const rules=children(node).filter(n=>n.tag==='rule').map(n=>({value:numericAttribute(n,'value',NaN),label:caption(n),role:ownTone(n)??'warning'}));
  if(rules.length>4||rules.some(r=>!Number.isFinite(r.value)))throw Error('Chart supports at most four numeric Rules');
  for(const s of series)if(!['linear','step'].includes(attr(s,'interpolate',attr(node,'interpolate','linear'))))throw Error('Chart interpolate must be linear or step');
  const interpolate=series.map(s=>attr(s,'interpolate',attr(node,'interpolate','linear')));
  return {series,data,min,max,roles,length,x,rules,interpolate,clipped:all.some(v=>v<min||v>max)};
}
function raster(data,roles,min,max,columns,rows,length,series,{x,interpolate=[]}={}) {
  const canvas=new BrailleCanvas(columns,rows);
  data.forEach((nums,i)=>{
    let previous=null;
    for(let j=0;j<nums.length;j++){
      const value=nums[j];if(value===null){previous=null;continue;}
      const fraction=x?(x.length===1?0:(x[j]-x[0])/(x.at(-1)-x[0])):j/Math.max(1,length-1);
      const point=[Math.round(fraction*(canvas.width-1)),Math.round((1-Math.max(0,Math.min(1,(value-min)/(max-min))))*(canvas.height-1))];
      if(previous){
        const dashed=attr(series[i],'stroke')==='dash';
        if(interpolate[i]==='step'){const elbow=[point[0],previous[1]];canvas.line(previous,elbow,roles[i],i,dashed);canvas.line(elbow,point,roles[i],i,dashed);}
        else canvas.line(previous,point,roles[i],i,dashed);
      }
      else canvas.dot(...point,roles[i],i);
      previous=point;
    }
  });
  return canvas;
}
function legend(entries,width,ctx){
  const rows=[];let current=new Surface(width,1,ctx.measure),x=0;
  for(const {label,role}of entries){
    const words=wrap(label,width,ctx.measure);
    for(const word of words){
      const size=graphemes(word).reduce((s,g)=>s+ctx.measure(g),0);
      if(x && x+2+size>width){rows.push(current);current=new Surface(width,1,ctx.measure);x=0;}
      if(x)x+=2;
      current.put(x,0,word,role);x+=size;
      if(words.length>1){rows.push(current);current=new Surface(width,1,ctx.measure);x=0;}
    }
  }
  if(x||!rows.length)rows.push(current);
  return vstack(rows,width,0,ctx.measure);
}
function mini(data,roles,min,max,w,h,length,series,ctx,options={}) {
  const out=new Surface(w,h,ctx.measure);
  raster(data,roles,min,max,w,h,length,series,options).draw(out);
  return out;
}
function plot(node,info,w,ctx,{showLegend=true}={}) {
  const {series,data,min,max,roles,length,clipped,rules=[],x}=info;
  const h=integer(node,'height',6,2,16),title=caption(node),parts=[];
  if(title)parts.push(textSurface(title+(attr(node,'unit')?' · '+attr(node,'unit'):''),w,{...ctx,role:'muted'}));
  const axis=Math.max(format(min).length,format(max).length,format((min+max)/2).length)+2;
  if(w-axis<10){
    // Narrow screens retain EVERY series, including labels; no data-dependent series disappears.
    data.forEach((nums,i)=>{
      if(data.length>1)parts.push(textSurface(`${i+1} ${caption(series[i])||`Series ${i+1}`}`,w,{...ctx,role:roles[i]}));
      parts.push(mini([nums],[roles[i]],min,max,w,Math.min(h,3),length,[series[i]],ctx,{x:info.x,interpolate:[info.interpolate[i]]}));
    });
    parts.push(textSurface(`${format(min)}..${format(max)}${clipped?' (clipped)':''}`,w,{...ctx,role:'dim'}));
    for(const r of rules)parts.push(textSurface(`${r.label||'Rule'} = ${format(r.value)}${r.value<min||r.value>max?' (outside scale)':''}`,w,{...ctx,role:r.role}));
    if(bool(node,'stats',false))parts.push(statistics(info,w,ctx));
    return vstack(parts,w,0,ctx.measure);
  }
  const columns=w-axis,chart=new Surface(w,h+2,ctx.measure);
  const pixelY=v=>Math.round((1-(v-min)/(max-min))*(h*4-1));
  const ticks=new Map([max,(max+min)/2,min].map(v=>[Math.min(h-1,Math.floor(pixelY(v)/4)),v]));
  const hasZero=bool(node,'zeroLine',true)&&min<=0&&max>=0;
  const zeroRow=hasZero?Math.min(h-1,Math.floor(pixelY(0)/4)):-1;
  if(zeroRow>0&&zeroRow<h-1)ticks.set(zeroRow,0);
  for(let y=0;y<h;y++){
    chart.put(axis-1,y,'│','border');
    if(ticks.has(y)){
      const value=ticks.get(y),label=format(value);chart.put(Math.max(0,axis-2-label.length),y,label,'dim');
      if(bool(node,'grid',true))chart.put(axis,y,'╌'.repeat(columns),'border');
    }
  }
  // Rules use actual Braille dot coordinates, not rounded character-row values.
  const ruleCanvas=new BrailleCanvas(columns,h);
  if(hasZero)for(let x=0;x<ruleCanvas.width;x+=2)ruleCanvas.dot(x,pixelY(0),'muted',-1);
  for(let i=0;i<rules.length;i++){
    const r=rules[i];if(r.value<min||r.value>max)continue;
    for(let x=0;x<ruleCanvas.width;x++)if(x%6<4)ruleCanvas.dot(x,pixelY(r.value),r.role,-2-i);
  }
  ruleCanvas.draw(chart,axis,0);
  chart.put(axis-1,h,'└'+'─'.repeat(columns),'border');
  const start=String(attr(node,'start',x?format(x[0]):'0')),end=String(attr(node,'end',x?format(x.at(-1)):String(length-1)));
  chart.put(axis,h+1,fit(start,Math.floor(columns/2),true,ctx.measure),'dim');
  if(length>1){const e=fit(end,Math.floor(columns/2),true,ctx.measure),size=graphemes(e).reduce((n,g)=>n+ctx.measure(g),0);chart.put(w-size,h+1,e,'dim');}
  const canvas=raster(data,roles,min,max,columns,h,length,series,info);canvas.draw(chart,axis,0);parts.push(chart);
  if(showLegend && (data.length>1||rules.length)){
    const entries=(data.length>1?series:[]).map((s,i)=>({label:`${i+1} ${caption(s)||`Series ${i+1}`}`,role:roles[i]}));
    if(canvas.overlaps)entries.push({label:'+ overlap',role:'text'});
    for(const r of rules)entries.push({label:`${r.label||'Rule'} = ${format(r.value)}${r.value<min||r.value>max?' (outside scale)':''}`,role:r.role});
    parts.push(legend(entries,w,ctx));
  }
  if(bool(node,'stats',false))parts.push(statistics(info,w,ctx));
  if(clipped)parts.push(textSurface('! Values clipped to explicit range',w,{...ctx,role:'warning'}));
  return vstack(parts,w,0,ctx.measure);
}
function statistics(info,w,ctx){
  return vstack(info.data.map((values,i)=>{const s=chartStats(values);return textSurface(`${info.data.length>1?(caption(info.series[i])||`Series ${i+1}`)+': ':''}min ${s.min===null?'—':format(s.min)} · max ${s.max===null?'—':format(s.max)} · last ${s.last===null?'—':format(s.last)}`,w,{...ctx,role:info.roles[i]});}),w,0,ctx.measure);
}
export function renderChart(node,w,ctx) {
  const info=chartData(node,ctx),stacked=attr(node,'layout')==='stacked'||(ctx.monochrome&&info.data.length>1);
  if(!stacked||info.data.length===1)return plot(node,info,w,ctx);
  const parts=[];
  if(caption(node))parts.push(textSurface(caption(node),w,{...ctx,role:'muted'}));
  info.series.forEach((s,i)=>{
    const sub={...node,attrs:{...node.attrs,label:`${i+1} ${caption(s)||`Series ${i+1}`}`}};
    parts.push(plot(sub,{...info,series:[s],data:[info.data[i]],roles:[info.roles[i]],interpolate:[info.interpolate[i]]},w,ctx,{showLegend:true}));
  });
  return vstack(parts,w,1,ctx.measure);
}
export function renderSparkline(node,w,ctx) {
  const info=chartData(node,ctx),h=integer(node,'height',2,1,4);
  return mini(info.data,info.roles,info.min,info.max,w,h,info.length,info.series,ctx,info);
}
