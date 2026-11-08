import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from '../lib/parser.mjs';
import { renderDocument } from '../lib/render.mjs';
import { intrinsic, allocate, rowPlan } from '../lib/layout.mjs';
import { glyphWidth, widthOf, Surface } from '../lib/surface.mjs';
const ctx={measure:glyphWidth};
const plain=(xml,w)=>renderDocument(xml,w).plain();
test('intrinsic content sizing gives longer text priority over small badge',()=>{
 const small=intrinsic(parseDocument('<Badge>OK</Badge>'),ctx),large=intrinsic(parseDocument('<Text>Long descriptive text to explain an architecture decision</Text>'),ctx);
 assert.ok(large.ideal>small.ideal);assert.ok(small.min<16);
});
test('row wraps in groups, not always a single column',()=>{
 const ast=parseDocument('<Row><Metric label="A"/><Metric label="B"/><Metric label="C"/></Row>');
 const plans=rowPlan(ast.children,42,2,ctx);assert.deepEqual(plans.map(p=>p.indices),[[0,1],[2]]);
});
test('row minimum and maximum widths remain bounded over all budgets',()=>{
 for(let room=21;room<150;room++){
  const result=allocate([{min:10,ideal:25,max:60,flex:1},{min:11,ideal:20,max:30,flex:0}],room);
  assert.ok(result[0]>=10&&result[0]<=60);assert.ok(result[1]>=11&&result[1]<=30);assert.ok(result.reduce((a,b)=>a+b,0)<=room);
 }
});
test('allocation rejects impossible budgets',()=>assert.throws(()=>allocate([{min:20,ideal:20,max:30,flex:1}],10)));
test('explicit child maximum prevents a badge stretching across a row',()=>{
 const ast=parseDocument('<Row><Badge maxWidth={12}>OK</Badge><Text>Details</Text></Row>');assert.ok(rowPlan(ast.children,80,2,ctx)[0].widths[0]<=12);
});
test('Grid final partial row retains column width',()=>{
 const out=plain('<Grid cols={2} minWidth={18}><Card title="A"><Text>A</Text></Card><Card title="B"><Text>B</Text></Card><Card title="C"><Text>C</Text></Card></Grid>',60);
 const first=out.find(l=>l.includes(' A ')),last=out.find(l=>l.includes(' C '));assert.equal(first.indexOf('╮'),last.indexOf('╮'));
});
test('GridItem spans complete tracks and caps span after resize',()=>{
 const xml='<Grid cols={3} minWidth={12}><GridItem span={2}><Card title="span"><Text>X</Text></Card></GridItem><Card title="one"><Text>Y</Text></Card></Grid>';
 const s=plain(xml,60);const top=s.find(l=>l.includes('╭')); assert.ok(top.indexOf('╮')>30);for(const w of [10,20,40,60])for(const l of plain(xml,w))assert.ok(widthOf(l)<=w);
});
test('density compact reduces height without dropping content',()=>{
 const content='<Text>First</Text><Text>Second</Text><Text>Third</Text>';
 const compact=renderDocument(`<Card density="compact">${content}</Card>`,30),spacious=renderDocument(`<Card density="spacious">${content}</Card>`,30);
 assert.ok(compact.height<spacious.height);assert.match(compact.plain().join('\n'),/Third/);
});
test('right/center placement and bottom vertical alignment stay within budget',()=>{
 const xml='<Row align="end" valign="bottom"><Text maxWidth={8}>X</Text><Col maxWidth={10}><Text>A</Text><Text>B</Text></Col></Row>';
 const lines=plain(xml,40);assert.match(lines.at(-1),/X/);assert.ok(lines.every(l=>widthOf(l)<=40));assert.ok(lines[0].startsWith(' '));
});
test('long Unicode content is measured with host cell width callback',()=>{
 let calls=0;const measure=g=>{calls++;return glyphWidth(g);};
 const xml='<Grid cols={2}><Card title="汉字"><Text>👨‍👩‍👧‍👦 中文</Text></Card><Text>é Ж</Text></Grid>';
 const s=renderDocument(xml,28,{measure});assert.ok(calls>0);for(const l of s.plain())assert.ok(widthOf(l)<=28);
});
test('card stretching keeps a single bottom border',()=>{
 const out=plain('<Row><Card title="A"><Text>X</Text></Card><Card title="B"><Text>X</Text><Text>Y</Text><Text>Z</Text></Card></Row>',70);
 assert.equal((out.at(-1).match(/╰/g)||[]).length,2);assert.ok(out.slice(0,-1).every(l=>!l.includes('╰')));
});
test('writing on a wide continuation erases the whole old glyph',()=>{
 const s=new Surface(3,1);s.put(0,0,'中');s.put(1,0,'x');assert.equal(s.plain()[0],' x');assert.ok(widthOf(s.plain()[0])<=3);
});
test('blit never leaves half a wide glyph at the clipping boundary',()=>{
 const source=new Surface(2,1);source.put(0,0,'中');const dest=new Surface(2,1);dest.blit(source,1);assert.equal(dest.plain()[0],'');
});
test('blit erases wide destination glyphs when overwriting their continuation',()=>{
 const source=new Surface(1,1);source.put(0,0,'y');const dest=new Surface(3,1);dest.put(0,0,'中');dest.blit(source,1);assert.equal(dest.plain()[0],' y');
});
