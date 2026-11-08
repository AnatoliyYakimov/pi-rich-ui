/** Restricted XML/JSX, never evaluated. Standalone blocks only; no HTML or JS runtime. */
export const LIMITS = Object.freeze({ source: 24000, nodes: 300, depth: 20, message: 1000000 });
const names = 'ui box card row col grid grid-item text title caption badge icon divider spacer metric progress flow step graph node edge bars bar chart series sparkline table tr td th list item code span diff before after sequence actor message note tree timeline column rule';
const TAGS = new Set(names.split(' '));
const LEAVES = new Set('grid-item step node edge bar series tr td th item span before after actor message note column rule'.split(' '));
export const ROOTS = new Set([...TAGS].filter(t => !LEAVES.has(t)));
export const LANGUAGE = '__pi_rich_ui_native_v2';
const ALIASES = {griditem:'grid-item', 'table.row':'tr', 'table.cell':'td', 'table.head':'th', 'table.column':'column', 'diff.before':'before', 'diff.after':'after', 'sequence.actor':'actor', 'sequence.step':'step', 'sequence.message':'message', 'sequence.note':'note', 'tree.item':'item', 'tree.node':'item', 'timeline.step':'step', 'chart.series':'series', 'chart.rule':'rule'};
const canonical = s => ALIASES[s.toLowerCase()] ?? s.toLowerCase();
export function clean(s) {
  // Strip entire terminal commands before removing remaining controls. No OSC/CSI injection.
  return String(s).replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\|$)/g, '')
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/\x1b[_P^][\s\S]*?(?:\x1b\\|$)/g, '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\t/g, '  ');
}
function entities(s) {
  return clean(s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (all, key) => {
    if (key[0] !== '#') return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[key.toLowerCase()];
    const n = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '�';
  }));
}
function escaped(s, i) { let n=0; while (i>0 && s[--i] === '\\') n++; return n%2===1; }
export function readTag(s, at) {
  const m = /^<(\/?)\s*([A-Za-z][\w.-]*)\b/.exec(s.slice(at));
  if (!m) return null;
  let q='', braces=0, i=at+m[0].length;
  for (;i<s.length;i++) {
    const c=s[i];
    if (q) { if (c===q && !escaped(s,i)) q=''; continue; }
    if (c==='"' || c==="'") q=c;
    else if (c==='{') braces++;
    else if (c==='}') { if (--braces<0) throw Error('Unbalanced attribute braces'); }
    else if(c==='>' && braces===0) break;
  }
  if(i===s.length) return null;
  const raw=s.slice(at,i+1), closing=!!m[1], selfClosing=!closing && /\/\s*>$/.test(raw);
  const attrs=raw.slice(m[0].length,-1).replace(selfClosing?/\/\s*$/:/$^/,'');
  if(closing && attrs.trim()) throw Error('Closing tags cannot have attributes');
  return {tag:canonical(m[2]), rawName:m[2], closing, selfClosing, attrs, end:i+1};
}
function attributes(s) {
  const a=Object.create(null); let i=0;
  while(i<s.length) {
    while(/\s/.test(s[i]??'')) i++;
    if(i===s.length) break;
    const m=/^[a-zA-Z][\w-]*/.exec(s.slice(i));
    if(!m) throw Error('Invalid attribute');
    const k=m[0]; i+=k.length;
    if(/^on[A-Z]|^on[a-z]/.test(k) || ['__proto__','constructor','prototype','style','src','href'].includes(k)) throw Error('Unsupported attribute');
    if(Object.hasOwn(a,k)) throw Error('Duplicate attribute');
    while(/\s/.test(s[i]??'')) i++;
    if(s[i]!=='=') {a[k]=true;continue;}
    i++; while(/\s/.test(s[i]??'')) i++;
    let v;
    if(s[i]==='"' || s[i]==="'") {
      const q=s[i++], start=i;
      while(i<s.length && !(s[i]===q && !escaped(s,i))) i++;
      if(i===s.length) throw Error('Unclosed string');
      v=s.slice(start,i++);
    } else if(s[i]==='{') {
      const start=++i; let q='';
      while(i<s.length) {
        const c=s[i];
        if(q) {if(c===q && !escaped(s,i)) q='';}
        else if(c==='"'||c==="'") q=c;
        else if(c==='}') break;
        i++;
      }
      if(i===s.length) throw Error('Unclosed literal');
      v=s.slice(start,i++).trim();
      if(/^(['"])[\s\S]*\1$/.test(v)) v=v.slice(1,-1);
      else if(/^-?\d+(?:\.\d+)?$/.test(v)) { v=Number(v); if(!Number.isFinite(v)) throw Error('Non-finite number'); }
      else if(v==='true'||v==='false') v=v==='true';
      else throw Error('Only scalar literals are allowed inside braces');
    } else {
      const m2=/^[^\s<>]+/.exec(s.slice(i)); if(!m2) throw Error('Missing value');
      v=m2[0]; i+=v.length;
    }
    a[k]=typeof v==='string'?entities(v):v;
  }
  return a;
}
export function parseDocument(source) {
  if(typeof source!=='string' || source.length>LIMITS.source) throw Error('UI source exceeds limit');
  const outer={tag:'ui',attrs:{},children:[]}, stack=[outer]; let i=0,count=0;
  while(i<source.length) {
    const lt=source.indexOf('<',i);
    if(lt<0) {stack.at(-1).children.push(entities(source.slice(i)));break;}
    if(lt>i) stack.at(-1).children.push(entities(source.slice(i,lt)));
    const tok=readTag(source,lt);
    if(!tok) throw Error('Escape literal < as &lt;');
    if(!TAGS.has(tok.tag)) throw Error(`Unknown tag: ${tok.tag}`);
    if(tok.closing) {
      if(stack.length===1 || stack.at(-1).rawName!==tok.rawName) throw Error('Mismatched closing tag');
      stack.pop();
    } else {
      if(++count>LIMITS.nodes || stack.length>LIMITS.depth) throw Error('UI complexity limit');
      const node={tag:tok.tag,rawName:tok.rawName,attrs:attributes(tok.attrs),children:[]};
      stack.at(-1).children.push(node);
      if(!tok.selfClosing) stack.push(node);
    }
    i=tok.end;
  }
  if(stack.length!==1) throw Error('Unclosed tag');
  const roots=outer.children.filter(x=>typeof x!=='string'||x.trim());
  if(roots.length!==1 || typeof roots[0]==='string' || !ROOTS.has(roots[0].tag)) throw Error('Exactly one UI root required');
  return roots[0];
}
function boundary(s, start) {
  const stop=Math.min(s.length,start+LIMITS.source+1), stack=[]; let i=start;
  while(i<stop) {
    const lt=s.indexOf('<',i); if(lt<0 || lt>=stop) return null;
    const t=readTag(s.slice(0,stop),lt); if(!t) return null;
    if(t.closing) { if(stack.pop()!==t.rawName) return null; if(!stack.length) return t.end; }
    else if(!t.selfClosing) stack.push(t.rawName);
    else if(!stack.length) return t.end;
    i=t.end;
  }
  return null;
}
export function fenced(xml, language=LANGUAGE) {
  const runs=xml.match(/`+/g)??[]; const ticks='`'.repeat(Math.max(3,...runs.map(s=>s.length+1)));
  return `${ticks}${language}\n${xml}\n${ticks}`;
}
/** Display-only transform. Never alters a model/session message. */
export function transformMarkdown(source, {isStreaming=false, replace=(xml)=>fenced(xml), pending=true}={}) {
  if(typeof source!=='string' || source.length>LIMITS.message) return source;
  const lines=source.split('\n'), out=[]; let fence=null,roots=0;
  const offsets=[];let offset=0;for(const l of lines){offsets.push(offset);offset+=l.length+1;}
  for(let i=0;i<lines.length;i++) {
    const line=lines[i], fm=/^ {0,3}(`{3,}|~{3,})/.exec(line);
    if(fm) {
      if(!fence) fence={char:fm[1][0],size:fm[1].length};
      else if(fence.char===fm[1][0] && fm[1].length>=fence.size && !line.slice(fm[0].length).trim()) fence=null;
      out.push(line); continue;
    }
    if(fence) {out.push(line);continue;}
    const head=/^ {0,3}<([A-Za-z][\w.-]*)(?=[\s/>])/.exec(line);
    if(!head || !ROOTS.has(canonical(head[1]))) {out.push(line);continue;}
    if(++roots>64){out.push(source.slice(offsets[i]));break;}
    const rest=source.slice(offsets[i]), start=line.indexOf('<'); let end;
    try {end=boundary(rest,start);} catch {end=null;}
    if(end===null) {
      // Never transform descendants of an invalid/incomplete root as independent blocks.
      if(isStreaming && pending && rest.length<=LIMITS.source) out.push('',replace('<Caption>Rendering visual…</Caption>',null,true),'');
      else out.push(rest);
      break;
    }
    const xml=rest.slice(start,end), consumed=rest.slice(0,end).split('\n').length;
    const tail=rest.slice(end).split('\n')[0];
    if(tail.trim()) {out.push(...lines.slice(i,i+consumed));i+=consumed-1;continue;}
    try {
      const ast=parseDocument(xml);
      out.push('',replace(xml,ast,false),'');
    } catch {out.push(...lines.slice(i,i+consumed));}
    i+=consumed-1;
  }
  return out.join('\n');
}
