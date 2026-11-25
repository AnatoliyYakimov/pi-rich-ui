import test from 'node:test';
import assert from 'node:assert/strict';
import * as theme from '../lib/theme.mjs';
import { Surface } from '../lib/surface.mjs';
import { renderDocument } from '../lib/render.mjs';
const strip = s => s.replace(/\x1b\[[\d;]*m/g, '');
test('semantic surfaces validate names rather than accepting arbitrary colors', () => {
  assert.equal(theme.surfaceRole('subtle'), 'subtle');
  assert.throws(() => theme.surfaceRole('#ffffff'), /surface/);
});
test('backgrounds use explicit color depth and remain disabled under NO_COLOR', () => {
  for (const [mode, prefix] of [['truecolor','48;2;'],['256','48;5;']]) {
    assert.ok(theme.paint('x','text',{background:'subtle',colorMode:mode}).includes(prefix));
  }
  assert.equal(theme.paint('x','text',{background:'error',colors:false,bold:true}), 'x');
});
test('surface uses the host background role and respects terminal-default host panels', () => {
  const called=[];
  const host={fg:(_k,s)=>s,bg:(k,s)=>{called.push(k);return s;}};
  assert.equal(theme.paint('x','text',{background:'success',theme:host}), 'x');
  assert.deepEqual(called,['toolSuccessBg']);
});
test('default and semantic surfaces map to distinct host tokens with a neutral default', () => {
  const called=[];
  const host={fg:(_k,s)=>s,bg:(k,s)=>{called.push(k);return s;}};
  for (const role of ['subtle','info','success','warning','error']) theme.paint('x','text',{background:role,theme:host});
  assert.deepEqual(called,['toolPendingBg','selectedBg','toolSuccessBg','searchMatchBg','toolErrorBg']);
  assert.ok(!called.includes('customMessageBg'));
});
test('filled empty rows and trailing blanks are serialized but plain stays trimmed', () => {
  const s=new Surface(8,2); s.background(0,0,6,2,'subtle'); s.put(1,0,'X');
  const lines=s.ansi({colorMode:'truecolor'});
  assert.deepEqual(lines.map(strip), [' X    ','      ']);
  assert.deepEqual(s.plain(),[' X','']);
  assert.ok(lines.every(l=>l.endsWith('\x1b[0m')));
  assert.deepEqual(s.ansi({colorMode:'none'}),[' X','']);
});
test('child blanks inherit parent surface while child background overrides', () => {
  const parent=new Surface(6,1); parent.background(0,0,6,1,'subtle');
  const child=new Surface(3,1); child.background(1,0,1,1,'success'); parent.blit(child,1);
  assert.equal(parent.rows[0][1].background,'subtle');
  assert.equal(parent.rows[0][2].background,'success');
  assert.equal(parent.rows[0][3].background,'subtle');
  parent.put(2,0,'中'); assert.equal(parent.rows[0][3].background,'success');
});
test('cards fill vertical padding and stretched body, not rounded corners or above headings', () => {
  const s=renderDocument('<Card title="Heading" titlePosition="above"><Text>X</Text></Card>',24,{presentation:false});
  assert.equal(s.rows[0][0].background,undefined);
  const top=s.plain().findIndex(l=>l.includes('╭'));
  assert.equal(s.rows[top][0].background,undefined);
  assert.equal(s.rows[top+1][1].background,'subtle');
  assert.equal(s.plain()[top+1].trim(),'│                      │'.trim());
  assert.ok(s.plain()[top+2].includes('X'));
  const stretched=s.stretchTo(s.height+3);
  assert.equal(stretched.rows.at(-2)[1].background,'subtle');
});
test('framed surfaces fill only inside the frame so the fill never spills past the line', () => {
  for (const border of ['rounded','single']) {
    const s=renderDocument(`<Card border="${border}" title="T" titlePosition="border"><Text>X</Text></Card>`,16,{presentation:false});
    const last=s.height-1,right=s.width-1;
    for (let x=0;x<s.width;x++) {
      assert.equal(s.rows[0][x].background,undefined,`top ${border} ${x}`);
      assert.equal(s.rows[last][x].background,undefined,`bottom ${border} ${x}`);
    }
    for (let y=0;y<s.height;y++) {
      assert.equal(s.rows[y][0].background,undefined,`left ${border} ${y}`);
      assert.equal(s.rows[y][right].background,undefined,`right ${border} ${y}`);
    }
    for (let y=1;y<last;y++) for (let x=1;x<right;x++) assert.equal(s.rows[y][x].background,'subtle',`inside ${border} ${x},${y}`);
  }
});
test('border and surface are independent and disabling surface reveals parent', () => {
  const s=renderDocument('<Card border={false} surface="success" padding={0}><Text>X</Text></Card>',12);
  assert.equal(s.rows[0][0].background,'success');assert.equal(s.plain()[0],'X');
  const no=renderDocument('<Card surface="none"><Text>X</Text></Card>',12);
  assert.ok(no.rows.every(r=>r.every(c=>!c.background)));
  assert.throws(()=>renderDocument('<Card surface="white"/>'),/surface/);
});
test('badge background covers only its measured pill, including inline padding', () => {
  const block=renderDocument('<Badge tone="success">OK</Badge>',30);
  assert.equal(block.rows[0].filter(c=>c.background==='success').length,6);
  const s=renderDocument('<Text>A <Badge tone="error">Bad</Badge> Z</Text>',40);
  const line=s.plain()[0];assert.match(line,/A  ✗ Bad  Z/);
  const z=line.indexOf('Z');assert.equal(s.rows[0][z].background,undefined);
  assert.equal(s.rows[0].filter(c=>c.background==='error').length,7);
});
test('text alignment applies to each wrapped line without dropping Unicode', () => {
  const s=renderDocument('<Text align="center">АБ ВГ</Text>',8);
  assert.equal(s.plain()[0],' АБ ВГ');
  assert.equal(renderDocument('<Text align="right">X</Text>',8).plain()[0],'       X');
  assert.throws(()=>renderDocument('<Text align="diagonal">X</Text>'),/align/);
});
test('a heading that exhausts the height budget truncates safely above rounded cards', () => {
  for(const xml of [`<Box title="${'X'.repeat(3200)}"><Text>BODY</Text></Box>`,`<Card titlePosition="above" title="${'X'.repeat(3200)}">BODY</Card>`]){
    const s=renderDocument(xml,8);
    assert.equal(s.height,400);
    assert.match(s.plain().at(-1),/^…/);
  }
});
test('table cells retain the full status pill including its last shaded field', () => {
  const s=renderDocument('<Table><Column label="State"/><Tr><Td><Badge tone="success">OK</Badge></Td></Tr></Table>',80,{presentation:false});
  const row=s.rows.find(r=>r.some(c=>c.g==='✓'));
  assert.equal(row.filter(c=>c.background==='success').length,6);
});
test('table cells retain rectangular card backgrounds including completely blank rows', () => {
  for(const align of ['left','center','right']){
    const s=renderDocument(`<Table><Column label="State" minWidth={12} maxWidth={12}/><Tr><Td align="${align}"><Card border={false} surface="success"><Text>X</Text></Card></Td></Tr></Table>`,80,{presentation:false});
    const shaded=s.rows.slice(2).map(r=>r.filter(c=>c.background==='success').length);
    assert.deepEqual(shaded,[12,12,12]);
  }
});
test('automatic table panels do not crop headerless rich-cell surfaces to plain text', () => {
  const s=renderDocument('<Table><Tr><Td><Card width={12} flex={0} border={false} surface="success"><Text>X</Text></Card></Td></Tr></Table>',80);
  const shaded=s.rows.map(r=>r.filter(c=>c.background==='success').length).filter(Boolean);
  assert.deepEqual(shaded,[12,12,12]);
});
test('legacy graph mask fill does not become a visible background', () => {
  const s=new Surface(5,1);s.fill(0,0,5,1,'panel');s.put(0,0,'X');
  assert.doesNotMatch(s.ansi({colorMode:'truecolor'}).join(''),/48;/);
});
test('inline italic, underline and strike inherit like bold and keep underlined spaces continuous', () => {
  const s=renderDocument('<Text>a <Span italic underline>b c</Span> <Span strike>d</Span> <Span italic>e</Span></Text>',40,{presentation:false});
  const at=g=>s.rows[0][s.plain()[0].indexOf(g)];
  assert.equal(s.plain()[0],'a b c d e');
  assert.equal(at('a').marks,undefined);
  assert.equal(at('b').marks,'iu');
  assert.equal(s.rows[0][3].marks,'u');
  assert.equal(s.rows[0][1].marks,undefined);
  assert.equal(at('d').marks,'s');
  assert.equal(at('e').marks,'i');
  const off=renderDocument('<Caption italic>x <Span italic={false}>y</Span></Caption>',20,{presentation:false});
  assert.equal(off.rows[0][0].marks,'i');
  assert.equal(off.rows[0][2].marks,undefined);
});
test('text marks use host styles and fall back to ANSI, but disappear without color', () => {
  const s=renderDocument('<Text><Span italic>a</Span><Span underline> b</Span><Span strike> c</Span></Text>',20,{presentation:false});
  const called=[];
  const host={fg:(_k,t)=>t,bold:t=>t,italic:t=>{called.push('italic');return t;},underline:t=>{called.push('underline');return t;},strikethrough:t=>{called.push('strikethrough');return t;}};
  s.ansi({theme:host,colorMode:'truecolor'});
  assert.deepEqual(called,['italic','underline','strikethrough']);
  const fallback=s.ansi({colorMode:'truecolor'})[0];
  for (const code of ['\x1b[3m','\x1b[4m','\x1b[9m']) assert.ok(fallback.includes(code),JSON.stringify(code));
  assert.deepEqual(s.ansi({colorMode:'none'}),['a b c']);
});
test('double, heavy and dashed borders frame the card, keep the title and fill only inside', () => {
  const glyphs={double:['╔','═','╗','║','╚','╝'],heavy:['┏','━','┓','┃','┗','┛'],dashed:['╭','╌','╮','╎','╰','╯']};
  for (const [border,[tl,h,tr,v,bl,br]] of Object.entries(glyphs)) {
    const s=renderDocument(`<Card border="${border}" title="T" titlePosition="border"><Text>X</Text></Card>`,14,{presentation:false});
    const lines=s.plain();
    assert.equal(lines[0],`${tl}${h} T ${h.repeat(8)}${tr}`,border);
    assert.equal(lines[1][0],v,border);
    assert.equal(lines.at(-1),`${bl}${h.repeat(12)}${br}`,border);
    assert.equal(s.rows[1][0].background,undefined,border);
    assert.equal(s.rows[1][1].background,'subtle',border);
  }
  assert.throws(()=>renderDocument('<Card border="dotted"/>'),/border must be rounded, single, double, heavy, dashed, left, none, or boolean/);
});
test('title levels separate a section heading, the default and a quiet subheading', () => {
  const one=renderDocument('<Title level={1}>Plan</Title>',10,{presentation:false});
  assert.deepEqual(one.plain(),['Plan','━━━━━━━━━━']);
  assert.equal(one.rows[0][0].bold,true);assert.equal(one.rows[0][0].role,'accent');assert.equal(one.rows[1][0].role,'accent');
  const two=renderDocument('<Title level={2}>Plan</Title>',10,{presentation:false});
  const plainTitle=renderDocument('<Title>Plan</Title>',10,{presentation:false});
  assert.deepEqual(two.plain(),plainTitle.plain());assert.equal(two.rows[0][0].role,plainTitle.rows[0][0].role);
  const three=renderDocument('<Title level={3}>Plan</Title>',10,{presentation:false});
  assert.deepEqual(three.plain(),['Plan']);assert.equal(three.rows[0][0].role,'muted');assert.equal(three.rows[0][0].bold,true);
  assert.equal(renderDocument('<Title level={3} tone="success">Plan</Title>',10,{presentation:false}).rows[0][0].role,'success');
  assert.throws(()=>renderDocument('<Title level={4}>Plan</Title>'),/Title level must be 1, 2, or 3/);
});
