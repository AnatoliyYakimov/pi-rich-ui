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
