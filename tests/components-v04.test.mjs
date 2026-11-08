import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderDocument } from '../lib/render.mjs';
import { parseDocument, transformMarkdown, LANGUAGE } from '../lib/parser.mjs';
import { diffLines } from '../lib/diff.mjs';
import { tableModel } from '../lib/table.mjs';
import { sequenceModel } from '../lib/sequence.mjs';
import { widthOf } from '../lib/surface.mjs';
const draw = (xml, w=80, options={}) => renderDocument(xml,w,options);
const plain = (xml,w=80,options={}) => draw(xml,w,options).plain().join('\n');
const roles = surface => new Set(surface.rows.flat().filter(c=>c.g.trim()).map(c=>c.role));
const example = name => readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8');

for(const [tag,canonical] of [['Table.Row','tr'],['Table.Cell','td'],['Table.Head','th'],['Table.Column','column'],['Diff.Before','before'],['Diff.After','after'],['Sequence.Actor','actor'],['Sequence.Step','step'],['Tree.Item','item'],['Timeline.Step','step'],['Chart.Rule','rule']]) {
 test(`namespaced ${tag} maps to ${canonical}`,()=>{
  const root=parseDocument(`<UI><${tag}/></UI>`);assert.equal(root.children[0].tag,canonical);
 });
}
test('namespaced closing tags must still match exactly',()=>assert.throws(()=>parseDocument('<Table><Table.Row></Tr></Table>')));
test('nested component tags are not standalone Markdown roots',()=>assert.equal(transformMarkdown('<Table.Row values="x,y"/>'),'<Table.Row values="x,y"/>'));

test('compact headers and values agree with explicit cells',()=>{
 assert.equal(plain('<Table headers="Name,RPS"><Tr values="API,600"/></Table>'),plain('<Table><Tr><Th>Name</Th><Th>RPS</Th></Tr><Tr><Td>API</Td><Td>600</Td></Tr></Table>'));
});
test('table scalar cells format grouping, percent, decimals and unit',()=>{
 const s=plain('<Table><Column label="RPS"/><Column label="Load" format="percent" digits={1}/><Column label="p99" unit="ms"/><Tr><Td value={12345}/><Td value={0.125}/><Td value={25}/></Tr></Table>');
 for(const expected of ['12,345','12.5%','25 ms'])assert.ok(s.includes(expected),s);
});
test('numeric columns align by right edge, with cell override',()=>{
 const s=draw('<Table headers="Name,N"><Tr values="A,1"/><Tr values="B,123"/></Table>').plain();
 const a=s.find(l=>/^A\s/.test(l)),b=s.find(l=>/^B\s/.test(l));assert.equal(a.indexOf('1'),b.indexOf('123')+2);
 const t=plain('<Table><Column label="N" align="right"/><Tr><Td value={2} align="left"/></Tr></Table>',20);assert.match(t,/\n2(?:\n|$)/);
});
test('table preserves headerless first row and fills short rows with em dash',()=>{
 const s=plain('<Table><Tr><Td>FIRST</Td><Td>second</Td></Tr><Tr><Td>tail</Td></Tr></Table>');assert.match(s,/FIRST/);assert.match(s,/tail/);assert.match(s,/—/);
});
test('table refuses to drop cells beyond an explicitly declared schema',()=>assert.throws(()=>plain('<Table headers="A"><Tr values="1,2"/></Table>'),/more cells/));
test('table accepts inline Span, Badge, Sparkline and bar cells',()=>{
 const xml='<Table headers="State,Trend,Load"><Tr><Td><Badge tone="success">OK</Badge></Td><Td><Sparkline values="1,4,2"/></Td><Td value={50} bar max={100}/></Tr></Table>';
 for(const w of [24,80]){const s=draw(xml,w);assert.match(s.plain().join('\n'),/✓ OK/);assert.match(s.plain().join('\n'),/[\u2801-\u28ff]/);assert.match(s.plain().join('\n'),/█/);assert.ok(roles(s).has('success'));}
});
test('threshold styling is strict, prioritized and not color-only',()=>{
 const xml='<Table><Column label="Latency" warnAbove={100} errorAbove={200} unit="ms"/><Tr><Td value={100}/></Tr><Tr><Td value={150}/></Tr><Tr><Td value={250}/></Tr></Table>';
 for(const width of [18,80]){const s=draw(xml,width);assert.match(s.plain().join('\n'),/! 150 ms/);assert.match(s.plain().join('\n'),/✗ 250 ms/);assert.ok(roles(s).has('warning'));assert.ok(roles(s).has('error'));}
});
test('table errors on invalid threshold and bar range',()=>{
 for(const xml of ['<Table><Column label="X" warnAbove="NaN"/><Tr><Td value={1}/></Tr></Table>','<Table><Tr><Td value={1} bar min={5} max={2}/></Tr></Table>'])assert.throws(()=>plain(xml));
});
test('table bar clipping is stated and explicit row/cell tone wins thresholds',()=>{
 assert.match(plain('<Table><Tr><Td value={120} bar max={100}/></Tr></Table>'),/clipped/);
 const s=draw('<Table><Column label="X" errorAbove={1}/><Tr tone="success"><Td value={9}/></Tr></Table>');assert.ok(roles(s).has('success'));assert.ok(!roles(s).has('error'));
});
test('table stacked view preserves every label and field',()=>{
 const s=plain('<Table headers="Service,RPS,State"><Tr values="API,600,healthy"/></Table>',20);for(const t of ['Service: API','RPS: 600','State: healthy'])assert.ok(s.includes(t),s);
});
test('table can show definitions without data and validates column bounds',()=>{
 assert.match(plain('<Table headers="A,B"/>'),/A/);
 assert.throws(()=>plain('<Table headers="'+Array(13).fill('col').join(',')+'"/>'),/12 columns/);
});

test('numeric diff computes sign and relative percentage',()=>{
 const s=draw('<Diff label="p99" before={600} after={120} unit="ms" good="down"/>');assert.match(s.plain().join('\n'),/-480 ms · -80%/);assert.match(s.plain().join('\n'),/improved/);assert.ok(roles(s).has('success'));
});
test('diff never assumes a larger number is better by default',()=>{
 const s=draw('<Diff before={8} after={16}/>');assert.ok(roles(s).has('accent'));assert.ok(!roles(s).has('success'));assert.ok(!roles(s).has('error'));
});
test('zero baseline, negative baseline, unchanged and percentage overflow',()=>{
 assert.match(plain('<Diff before={0} after={10}/>'),/n\/a % \(baseline 0\)/);
 assert.match(plain('<Diff before={-10} after={-5}/>'),/\+50%/);
 assert.match(plain('<Diff before={5} after={5}/>'),/Δ 0/);
 assert.match(plain('<Diff before="5e-324" after={10}/>'),/overflow/);
});
test('diff semantic wording does not follow an overridden color',()=>{
 const s=plain('<Diff before={10} after={5} good="down" tone="error"/>');assert.match(s,/improved/);assert.ok(!s.includes('regressed'));
});
test('diff rejects missing numeric side, invalid value and invalid good',()=>{
 for(const xml of ['<Diff before={1}/>','<Diff before="no" after={2}/>','<Diff before={1} after={2} good="yes"/>'])assert.throws(()=>plain(xml));
});
test('line diff reconstructs both originals exactly',()=>{
 for(const [a,b] of [['',''],['a','b'],['same\na\nb','same\nb\nc'],['x\nx\ny','y\nx'],['  x\n\n  y','  x\n\n  z']]){
  const ops=diffLines(a,b);assert.equal(ops.filter(o=>o.type!=='add').map(o=>o.text).join('\n'),a);assert.equal(ops.filter(o=>o.type!=='remove').map(o=>o.text).join('\n'),b);
 }
});
test('unified and side-by-side diffs retain changes and indentation',()=>{
 const xml='<Diff><Before>root:\n  a: 1\n  same: x</Before><After>root:\n  a: 2\n  same: x</After></Diff>';
 for(const w of [40,100]){const s=plain(xml,w);for(const t of ['root:','  a: 1','  a: 2','  same: x'])assert.ok(s.includes(t),s);assert.match(s,/\+1 \/ −1 lines/);}
});
test('diff collapses distant unchanged lines with explicit count',()=>{
 const before=Array.from({length:20},(_,i)=>'line'+i),after=[...before];after[10]='changed';
 assert.match(plain(`<Diff context={1}><Before>${before.join('\n')}</Before><After>${after.join('\n')}</After></Diff>`),/unchanged lines/);
});
test('diff LCS has a strict line limit',()=>assert.throws(()=>diffLines(Array(161).fill('x').join('\n'),'x'),/160 lines/));
test('diff code entities remain literal rather than executable tags',()=>assert.match(plain('<Diff><Before>&lt;A /&gt;</Before><After>&lt;B /&gt;</After></Diff>'),/<B \/>/));

test('sequence supports forward, reverse, return, self call and notes',()=>{
 const s=plain(example('sequence'),96);for(const t of ['COMMIT','Fetch unpublished','ACK','Process ACK','repeat publication'])assert.ok(s.includes(t),s);assert.match(s,/▶/);assert.match(s,/◀/);assert.match(s,/╌/);assert.match(s,/┐/);
});
test('sequence narrow view is chronological and preserves endpoints',()=>{
 const s=plain('<Sequence actors="API,DB"><Step from="API" to="DB" label="save"/><Step from="DB" to="API" label="ack" kind="return"/></Sequence>',25);
 assert.ok(s.indexOf('1.')<s.indexOf('2.'));assert.match(s,/API → DB: save/);assert.match(s,/DB ⇢ API/);assert.match(s,/return/);
});
test('sequence Actor labels differ from stable IDs',()=>{
 const s=plain('<Sequence><Actor id="a" label="Gateway"/><Actor id="b" label="Database"/><Step from="a" to="b" label="query"/></Sequence>');assert.match(s,/Gateway/);assert.match(s,/Database/);
});
test('sequence rejects unknown or duplicate endpoints and actor definitions',()=>{
 for(const xml of ['<Sequence actors="A,A"/>','<Sequence actors="A,B"><Step from="A" to="X"/></Sequence>','<Sequence actors="A"><Note over="X">bad</Note></Sequence>','<Sequence actors="A"><Actor id="B"/></Sequence>'])assert.throws(()=>plain(xml));
});
test('sequence can infer actor order only when no actor definitions supplied',()=>{
 const m=sequenceModel(parseDocument('<Sequence><Step from="A" to="B" label="x"/><Step from="B" to="C" label="y"/></Sequence>'));assert.deepEqual(m.actors.map(a=>a.id),['A','B','C']);
});
test('sequence wide labels wrap instead of truncating',()=>{
 const xml='<Sequence><Actor id="a" label="Long descriptive gateway name"/><Actor id="b" label="Store"/><Step from="a" to="b" label="Important transaction ending TOKEN"/></Sequence>';
 const s=plain(xml,60);assert.match(s,/TOKEN/);assert.match(s,/gateway/);
});

test('tree maintains siblings, continuation branches and detail',()=>{
 const s=plain('<Tree label="Root"><Item label="A"><Item label="a"/><Item label="b" detail="Detail"/></Item><Item label="B"/></Tree>');for(const t of ['├─ A','│  ├─ a','│  └─ b','└─ B','Detail'])assert.ok(s.includes(t),s);
});
test('tree collapsed subtrees disclose hidden count, not child content',()=>{
 const s=plain('<Tree><Item label="tests" collapsed><Item label="SECRET"><Item label="nested"/></Item></Item></Tree>');assert.match(s,/2 hidden/);assert.ok(!s.includes('SECRET'));
});
test('long tree labels preserve final token at narrow widths',()=>assert.match(plain('<Tree><Item label="a long label with END"/></Tree>',12),/END/));
test('tree rejects unrelated child tags instead of silently hiding them',()=>assert.throws(()=>plain('<Tree><Metric label="x"/></Tree>')));

test('timeline displays explicit status names and symbols in monochrome',()=>{
 const s=plain('<Timeline direction="TB"><Step label="A" status="done"/><Step label="B" status="blocked"/><Step label="C" status="pending"/></Timeline>',50,{monochrome:true});for(const t of ['✓ 1. A [done]','! 2. B [blocked]','○ 3. C [pending]'])assert.ok(s.includes(t),s);
});
test('timeline does not silently assume completion status',()=>{const s=plain('<Timeline><Step label="A"/></Timeline>');assert.ok(!s.includes('[pending]'));assert.match(s,/1. A/);});
test('timeline wraps to vertical and retains dates and details',()=>{
 const xml='<Timeline><Step label="First" status="done" date="2026-11-08" detail="Ready"/><Step label="Second" status="active"><Text>Review</Text></Step></Timeline>';
 assert.ok(draw(xml,30).height>draw(xml,100).height);const s=plain(xml,30);for(const t of ['2026-11-08','Ready','Review'])assert.ok(s.includes(t));
});
test('timeline rejects unsupported status rather than rendering fabricated semantics',()=>assert.throws(()=>plain('<Timeline><Step label="A" status="awesome"/></Timeline>')));

for(const file of ['demo','table','diff','sequence','tree','timeline','layout','charts-v04']){
 test(`${file} v0.4 widths 1..160: no overflow, no broken ANSI, bounded height`,()=>{
  const xml=example(file);
  for(let width=1;width<=160;width++){
   const surface=draw(xml,width),ansi=surface.ansi({colorMode:'truecolor'}),lines=surface.plain();
   assert.ok(surface.height<=400);
   lines.forEach((line,i)=>{assert.ok(widthOf(line)<=width,`${file} @${width}: ${line}`);assert.equal(ansi[i].replace(/\x1b\[[\d;]*m/g,''),line);assert.ok(!/[\x00-\x08\x0b-\x1f]/.test(line));});
  }
 });
}
test('every streaming prefix is safe and completed blocks transform once',()=>{
 for(const name of ['table','diff','sequence','tree','timeline']){
  const xml=example(name);
  for(let end=0;end<=xml.length;end+=7){const value=transformMarkdown(xml.slice(0,end),{isStreaming:true});assert.equal(typeof value,'string');assert.ok(value.length<xml.length+1000);}
  const done=transformMarkdown(xml,{isStreaming:false});assert.ok(done.includes(LANGUAGE));assert.ok(!done.includes('Rendering visual…'));
  const literal='```xml\n'+xml+'\n```';assert.equal(transformMarkdown(literal),literal);
 }
});
test('malformed new component is left literal by native bridge fallback, not executed',()=>{
 const xml='<Sequence actors="API"><Step from="API" to="missing"/></Sequence>';
 assert.throws(()=>draw(xml));assert.doesNotThrow(()=>transformMarkdown(xml));
});
test('table preserves literal numeric identifiers and full precision',()=>{
 assert.match(plain('<Table><Tr values="001,1.234567891"/></Table>'),/001/);
 assert.match(plain('<Table><Tr values="001,1.234567891"/></Table>'),/1\.234567891/);
 assert.match(plain('<Table><Tr><Td value="5e-324"/></Tr></Table>'),/5e-324/);
});
test('table rejects ambiguous double row data and conflicting column definitions',()=>{
 assert.throws(()=>plain('<Table><Tr values="x"><Td>y</Td></Tr></Table>'));
 assert.throws(()=>plain('<Table headers="X"><Tr><Th>A</Th><Th>B</Th></Tr></Table>'));
});
test('Diff Before/After reject nested UI rather than losing its syntax',()=>assert.throws(()=>plain('<Diff><Before><Text>not literal XML</Text></Before><After>x</After></Diff>')));
test('deep containers disclose truncation after card framing',()=>{
 const xml='<Card><Col>'+Array(200).fill('<Metric label="x" value={1}/>').join('')+'</Col></Card>';
 assert.match(plain(xml,60),/truncated/);
});
