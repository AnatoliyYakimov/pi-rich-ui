import { clean } from './parser.mjs';
import { paint, backgroundVisible, surfaceRole } from './theme.mjs';
export { tone, PALETTES } from './theme.mjs';
const segmenter=new Intl.Segmenter('und',{granularity:'grapheme'});
export const graphemes=s=>[...segmenter.segment(String(s))].map(x=>x.segment);
export function glyphWidth(s) {
  if(/^[\p{Mark}\u200b-\u200f\ufe0e\ufe0f]+$/u.test(s)) return 0;
  if(/\p{Emoji_Presentation}|\p{Regional_Indicator}|\u20e3|\ufe0f/u.test(s) || /[\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe6f\uff01-\uff60\uffe0-\uffe6]/u.test(s)) return 2;
  return 1;
}
export const widthOf=s=>graphemes(clean(s)).reduce((n,g)=>n+glyphWidth(g),0);
export function fit(s,width,ellipsis=false,measure=glyphWidth) {
  s=clean(s); width=Math.max(0,width); let out='', n=0;
  const gs=graphemes(s), total=gs.reduce((a,g)=>a+measure(g),0), limit=width-(ellipsis && total>width && width>0?1:0);
  for(const g of gs) {const k=measure(g);if(n+k>limit) break;out+=g;n+=k;}
  return out+(ellipsis && total>width && width>0?'…':'');
}
export function wrap(s,width,measure=glyphWidth) {
  width=Math.max(1,width);const result=[];
  for(const paragraph of clean(s).split('\n')) {
    let line='',w=0;
    for(const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const gw=graphemes(word).reduce((n,g)=>n+measure(g),0);
      if(w && w+1+gw<=width) {line+=' '+word;w+=1+gw;continue;}
      if(w) {result.push(line);line='';w=0;}
      for(const g of graphemes(word)) {
        const k=measure(g);
        if(k>width) {if(line){result.push(line);line='';w=0;}result.push('�');continue;}
        if(w+k>width) {result.push(line);line='';w=0;}
        line+=g;w+=k;
      }
    }
    if(line || !paragraph.trim()) result.push(line);
  }
  return result.length?result:[''];
}
export class Surface {
  constructor(width,height=1,measure=glyphWidth) {
    this.width=Math.max(1,Math.min(240,Math.floor(width)||1));
    this.height=Math.max(1,Math.min(400,Math.floor(height)||1));
    this.truncated=Number.isFinite(height)&&height>this.height;
    this.measure=measure;
    this.rows=Array.from({length:this.height},()=>Array.from({length:this.width},()=>({g:' ',role:'text'})));
    this.connections=new Map();
  }
  clearCell(x,y) {
    if(x<0||x>=this.width||y<0||y>=this.height)return;
    const row=this.rows[y];let lead=x;
    while(lead>0&&row[lead]?.cont)lead--;
    const size=row[lead]?.cont?1:Math.max(1,this.measure(row[lead]?.g??' '));
    for(let i=lead;i<Math.min(this.width,lead+size);i++)row[i]={g:' ',role:'text',fill:row[i].fill,background:row[i].background};
  }
  markTruncated() {
    if(!this.truncated)return;
    this.rows[this.height-1]=Array.from({length:this.width},()=>({g:' ',role:'text'}));
    this.put(0,this.height-1,fit('… visual truncated; split it into smaller blocks',this.width,true,this.measure),'warning');
  }
  put(x,y,text,role='text',bold=false,fill,background) {
    if(y<0||y>=this.height) {if(y>=this.height)this.truncated=true;return;} x=Math.floor(x);
    for(const g of graphemes(clean(text).replace(/\n/g, ' '))) {
      const n=this.measure(g); if(!n) continue;
      if(x+n>this.width) break;
      if(x>=0) {
        const old=this.rows[y][x];
        for(let j=0;j<n;j++)this.clearCell(x+j,y);
        this.rows[y][x]={g,role,bold,fill:fill??old?.fill,background:background??old?.background};
        for(let j=1;j<n;j++) this.rows[y][x+j]={g:'',role,bold,fill:fill??old?.fill,background:background??old?.background,cont:true};
      }
      x+=n;
    }
  }
  fill(x,y,w,h,color='panel') {
    for(let r=Math.max(0,y);r<Math.min(this.height,y+h);r++)
      for(let c=Math.max(0,x);c<Math.min(this.width,x+w);c++) this.rows[r][c].fill=color;
  }
  background(x,y,w,h,role) {
    role=surfaceRole(role);
    if (role==='none' || role==='auto') return;
    for(let r=Math.max(0,y);r<Math.min(this.height,y+h);r++)
      for(let c=Math.max(0,x);c<Math.min(this.width,x+w);c++) this.rows[r][c].background=role;
  }
  blit(other,x=0,y=0) {
    if(other.truncated||y+other.height>this.height)this.truncated=true;
    for(let r=0;r<other.height;r++)for(let c=0;c<other.width;c++){
      const cell=other.rows[r][c];if(cell.cont)continue;
      const size=Math.max(1,this.measure(cell.g));
      if(y+r<0||y+r>=this.height||x+c<0||x+c+size>this.width)continue;
      const fill=cell.fill??this.rows[y+r][x+c].fill;
      const background=cell.background??this.rows[y+r][x+c].background;
      for(let k=0;k<size;k++)this.clearCell(x+c+k,y+r);
      this.rows[y+r][x+c]={...cell,fill,background};
      for(let k=1;k<size;k++)this.rows[y+r][x+c+k]={...other.rows[r][c+k],fill,background};
    }
  }
  frame(x,y,w,h,role='border',title='',style='rounded') {
    if(w<3||h<2) return;
    const [tl,tr,bl,br]=style==='single'?['┌','┐','└','┘']:['╭','╮','╰','╯'];
    this.put(x,y,tl+'─'.repeat(w-2)+tr,role);
    this.put(x,y+h-1,bl+'─'.repeat(w-2)+br,role);
    for(let r=y+1;r<y+h-1;r++){this.put(x,r,'│',role);this.put(x+w-1,r,'│',role);}
    if(title && w>8) this.put(x+2,y,' '+fit(title,w-7,true,this.measure)+' ',role,true);
  }
  path(points,role='dim') {
    const glyph={1:'╵',2:'╶',3:'└',4:'╷',5:'│',6:'┌',7:'├',8:'╴',9:'┘',10:'─',11:'┴',12:'┐',13:'┤',14:'┬',15:'┼'};
    const add=(x,y,mask)=>{if(x<0||x>=this.width||y<0||y>=this.height)return;const k=y*this.width+x,m=(this.connections.get(k)??0)|mask;this.connections.set(k,m);this.put(x,y,glyph[m]??'·',role);};
    for(let i=1;i<points.length;i++) {
      let [x,y]=points[i-1];const [tx,ty]=points[i],dx=Math.sign(tx-x),dy=Math.sign(ty-y);
      if(dx&&dy) throw Error('Only orthogonal paths');
      while(x!==tx||y!==ty) {const a=dx>0?2:dx<0?8:dy>0?4:1,b=dx>0?8:dx<0?2:dy>0?1:4;add(x,y,a);x+=dx;y+=dy;add(x,y,b);}
    }
  }
  plain() { this.markTruncated(); return this.rows.map(r=>r.map(c=>c.g).join('').trimEnd()); }
  ansi({theme,appearance='dark',colors=true,colorMode='16'}={}) {
    this.markTruncated();
    const enabled=colors && colorMode!=='none';
    const style=(text,cell)=>paint(text,cell.role,{theme,appearance,colors:enabled,colorMode,bold:cell.bold,background:cell.background});
    return this.rows.map(row=>{
      let line='',chunk='',prev=null;
      // Preserve only intentionally shaded trailing cells; never paint past this surface.
      let last=row.length-1;
      while(last>=0 && row[last].g===' ' && !backgroundVisible(row[last].background,{theme,colors:enabled,colorMode}))last--;
      for(const c of row.slice(0,last+1)) {
        if(c.cont)continue;
        const key=[c.role,c.bold||false,c.background??'none'].join(':');
        if(prev && key!==prev.key){line+=style(chunk,prev.cell);chunk='';}
        chunk+=c.g;prev={key,cell:c};
      }
      if(prev)line+=style(chunk,prev.cell);
      return enabled && line?line+'\x1b[0m':line;
    });
  }
}
export function vstack(parts,width,gap=0,measure=glyphWidth) {
  parts=parts.filter(Boolean);if(!parts.length)return new Surface(width,1,measure);
  const total=parts.reduce((n,p)=>n+p.height,0)+gap*(parts.length-1),out=new Surface(width,total,measure);
  let y=0;for(const p of parts){out.blit(p,0,y);y+=p.height+gap;}
  if(total>out.height)out.put(0,out.height-1,fit('… visual truncated; split it into smaller blocks',width,true,measure),'warning');
  return out;
}
export function textSurface(text,width,{role='text',bold=false,measure=glyphWidth}={}) {
  const lines=wrap(text,width,measure),out=new Surface(width,lines.length,measure);
  lines.forEach((s,i)=>out.put(0,i,s,role,bold));return out;
}
