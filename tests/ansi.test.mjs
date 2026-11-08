import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tone,ownTone,paint,ROLE_TOKENS,ALIASES,detectColorMode } from '../lib/theme.mjs';
import { ICONS } from '../lib/icons.mjs';
import { renderDocument } from '../lib/render.mjs';
import { Surface,widthOf } from '../lib/surface.mjs';
import { chartData,BrailleCanvas,DOTS,readValues } from '../lib/charts.mjs';
import { parseDocument,transformMarkdown } from '../lib/parser.mjs';
const draw=(s,w=70,opts={})=>renderDocument(s,w,opts);
const plain=(s,w=70,opts={})=>draw(s,w,opts).plain().join('\n');
const esc=/\x1b\[[\d;]*m/g;
const allRoles=s=>new Set(s.rows.flat().filter(c=>c.g.trim()).map(c=>c.role));
for(const [alias,role]of Object.entries(ALIASES))test(`semantic alias ${alias} -> ${role}`,()=>assert.equal(tone(alias),role));
test('unknown roles cannot inject ANSI and fall back to known palette',()=>{assert.equal(tone('#ff00ff'),'accent');assert.equal(tone('\x1b[31m'),'accent');assert.equal(tone('GREEN'),'success');});
test('tone overrides color and unknown roles never become host theme tokens',()=>{assert.equal(ownTone({attrs:{tone:'warning',color:'red'}}),'warning');assert.equal(ownTone({attrs:{color:'green'}}),'success');});
for(const [role,token]of Object.entries(ROLE_TOKENS))test(`theme mapping ${role} -> ${token}`,()=>{
  const called=[];const result=paint('x',role,{theme:{fg:(k,s)=>{called.push(k);return s;}}});assert.deepEqual(called,[token]);assert.equal(result,'x');
});
test('native backgrounds use SGR without image or terminal placement commands',()=>{
  const s=draw('<Box><Badge color="green">OK</Badge></Box>').ansi({colorMode:'truecolor'}).join('\n');
  assert.match(s,/48;2/);assert.ok(!/\x1b_G|1337;File|\x1b\[\d+[HJK]/.test(s));assert.match(s,/38;2/);
});
test('16, 256 and truecolor fallback are explicit and color depth detection is conservative',()=>{
  assert.match(paint('x','success',{colorMode:'16'}),/\x1b\[32m/);
  assert.match(paint('x','success',{colorMode:'256'}),/38;5;/);
  assert.match(paint('x','success',{colorMode:'truecolor'}),/38;2;/);
  assert.equal(detectColorMode({}),'16');assert.equal(detectColorMode({TERM:'xterm-256color'}),'256');assert.equal(detectColorMode({COLORTERM:'truecolor'}),'truecolor');
  assert.equal(detectColorMode({PI_RICH_UI_COLORS:'truecolor',NO_COLOR:''}),'none');assert.equal(detectColorMode({TERM:'dumb'}),'none');
});
test('older theme missing a token falls back safely',()=>assert.match(paint('x','cyan',{theme:{fg(){throw Error('unknown');}}}),/\x1b\[36m/));
test('NO_COLOR suppresses colors and bold even if theme exists',()=>assert.equal(paint('x','error',{colors:false,bold:true,theme:{fg(){throw Error();}}}),'x'));
test('box tone scopes accents without recoloring neutral body text',()=>{
  const s=draw('<Box tone="success"><Metric label="M" value="V"/><Text>Body</Text><Caption>Note</Caption><Metric label="N" value="X" tone="error"/></Box>');
  const get=ch=>s.rows.flat().find(c=>c.g===ch)?.role;
  assert.equal(get('V'),'success');assert.equal(get('B'),'text');assert.equal(get('N'),'muted');assert.equal(get('X'),'error');
});
test('status badges distinguish meaning without color',()=>{
  const s=plain('<Col><Badge color="green">OK</Badge><Badge color="red">Fail</Badge><Badge color="yellow">Warn</Badge><Badge color="blue">Info</Badge></Col>');
  for(const v of ['✓ OK','✗ Fail','! Warn','i Info'])assert.ok(s.includes(v));
});
test('Span style boundaries preserve natural word composition and inline icons',()=>{
  const s=draw('<Text>Hello <Span tone="success" bold>wo</Span><Span color="red">rld</Span> <Icon name="database" color="cyan"/> done</Text>',60);
  assert.equal(s.plain().join(''),'Hello world ▤ done');assert.ok(allRoles(s).has('success'));assert.ok(allRoles(s).has('error'));assert.ok(allRoles(s).has('cyan'));
  assert.ok(s.rows.flat().find(c=>c.g==='w').bold);
});
test('Span words and CJK/emoji wrap without corrupting cell widths',()=>{
  const xml='<Text><Span color="red">汉字🚀éABC</Span> <Icon name="database"/> one two three</Text>';
  for(const width of [1,2,3,5,8,12,24])for(const line of draw(xml,width).plain())assert.ok(widthOf(line)<=width,line);
});
test('standalone Span stays literal; it is an inline child, not a UI root',()=>assert.equal(transformMarkdown('<Span>literal</Span>'),'<Span>literal</Span>'));
test('Title and Caption accept explicit semantic tones',()=>{
  assert.ok(allRoles(draw('<Title color="red">X</Title>')).has('error'));assert.ok(allRoles(draw('<Caption tone="warning">X</Caption>')).has('warning'));
});
test('table tones survive wide and narrow layouts; a headerless table keeps first row',()=>{
  const xml='<Table><Tr><Td color="green">FIRST</Td><Td>OK</Td></Tr><Tr><Td color="red">SECOND</Td><Td>FAIL</Td></Tr></Table>';
  for(const width of [18,70]){const s=draw(xml,width);assert.match(s.plain().join('\n'),/FIRST/);assert.ok(allRoles(s).has('success'));assert.ok(allRoles(s).has('error'));}
});
test('graph edges use their own tone',()=>{
  const s=draw('<Graph><Node id="a" label="A"/><Node id="b" label="B"/><Edge from="a" to="b" tone="error"/></Graph>');
  assert.equal(s.rows.flat().find(c=>c.g==='▶').role,'error');
});
test('grid minWidth applies to row sizing as well as column count',()=>{
  const s=draw('<Grid cols={3} minWidth={18}><Metric label="A" value={1}/><Metric label="B" value={2}/><Metric label="C" value={3}/></Grid>',60,{presentation:false});
  assert.equal(s.height,2);assert.ok(s.plain()[0].includes('A')&&s.plain()[0].includes('C'));
});
for(const [name,glyph]of Object.entries(ICONS))test(`icon ${name} stays one text cell`,()=>assert.equal(widthOf(glyph),1));
for(let y=0;y<4;y++)for(let x=0;x<2;x++)test(`Braille bit ${x},${y}`,()=>{
  const b=new BrailleCanvas(1,1),s=new Surface(1,1);b.dot(x,y);b.draw(s);assert.equal(s.plain()[0].codePointAt(0),0x2800+DOTS[y][x]);
});
test('all eight Braille dots produce U+28FF and line work is bounded',()=>{
  const b=new BrailleCanvas(1,1),s=new Surface(1,1);for(let y=0;y<4;y++)for(let x=0;x<2;x++)b.dot(x,y);b.draw(s);assert.equal(s.plain()[0],'⣿');
  assert.throws(()=>b.line([0,0],[1e10,2],'accent'));assert.throws(()=>new BrailleCanvas(241,1));
});
test('overlaid cell has neutral union instead of last-series color',()=>{
  const b=new BrailleCanvas(2,1),s=new Surface(2,1);b.dot(0,0,'success',0);b.dot(1,1,'error',1);b.draw(s);
  assert.equal(b.overlaps,true);assert.equal(s.rows[0][0].role,'text');assert.equal(s.plain()[0].codePointAt(0),0x2800+1+16);
});
test('chart legend explicitly identifies overlap',()=>assert.match(plain('<Chart><Series label="A" values="1,2,3"/><Series label="B" values="1,2,3"/></Chart>'),/\+ overlap/));
test('sample parser preserves explicit missing data and rejects empty entries',()=>{
  assert.deepEqual(readValues(parseDocument('<Chart values="1,null,_,2"/>')),[1,null,null,2]);
  for(const values of ['1,,2','1,','',',2','NaN,2','Infinity,2','null,_'])assert.throws(()=>plain(`<Chart values="${values}"/>`));
});
test('missing samples break lines rather than interpolating across gaps',()=>{
  const s=draw('<Sparkline values="1,null,null,1" height={2}/>',20,{presentation:false});assert.ok(s.rows.every(r=>r.slice(4,16).every(c=>c.g===' ')));
});
test('series share sample index scale and shorter series do not stretch',()=>{
  const ast=parseDocument('<Chart><Series values="1,2"/><Series values="1,2,3,4,5"/></Chart>');
  const data=chartData(ast);assert.equal(data.length,5);assert.equal(data.data[0].length,2);
  const s=draw('<Chart grid={false}><Series label="short" values="6,7" color="red"/><Series label="long" values="0,1,2,1,0" color="green"/></Chart>',60);
  const red=s.rows.flatMap((r,y)=>r.map((c,x)=>({c,x,y}))).filter(v=>v.c.role==='error'&&/[\u2801-\u28ff]/u.test(v.c.g));
  assert.ok(red.length);assert.ok(red.every(v=>v.x<25));
});
test('single, constant, negative and tiny sample series render truthfully',()=>{
  for(const values of ['7','0,0,0','-2,-4,-1','.00001,.00002,.00003'])assert.match(plain(`<Chart values="${values}"/>`),/[\u2801-\u28ff]/u);
});
test('explicit invalid or degenerate ranges are rejected instead of silently changed',()=>{
  for(const attrs of ['min="abc"','min={5} max={1}','min={2} max={2}','max="Infinity"'])assert.throws(()=>plain(`<Chart values="1,2,3" ${attrs}/>`));
});
test('explicit clipped range has visible warning and safe runtime',()=>assert.match(plain('<Chart values="-999,0,999" min={-1} max={1}/>'),/clipped/));
test('narrow charts preserve all four labeled series',()=>{
  const s=plain('<Chart><Series label="alpha" values="1,4,2"/><Series label="beta" values="2,3,1"/><Series label="gamma" values="3,1,2"/><Series label="delta" values="1,1,2"/></Chart>',18);
  for(const label of ['alpha','beta','gamma','delta'])assert.match(s,new RegExp(label));
});
test('long legends wrap rather than dropping later series',()=>{
  const s=plain('<Chart><Series label="current baseline very long" values="1,4,2"/><Series label="previous baseline very long" values="2,3,1"/><Series label="TAIL_PRESENT" values="4,3,4"/></Chart>',35);
  assert.match(s,/TAIL_PRESENT/);assert.match(s,/previous/);
});
test('both Chart and Sparkline use Braille, not block-character sparklines',()=>{
  for(const tag of ['Chart','Sparkline']){const s=plain(`<${tag} values="1,4,2,6"/>`);assert.match(s,/[\u2801-\u28ff]/);assert.ok(!/[▁▂▃▄▅▆▇█]/.test(s));}
});
test('multiseries monochrome view retains shared scales with independent plots',()=>{
  const xml='<Chart><Series label="A" values="1,2"/><Series label="B" values="10,20"/></Chart>';
  const s=plain(xml,50,{monochrome:true});assert.equal((s.match(/20 │/g)||[]).length,2);assert.equal((s.match(/└/g)||[]).length,2);
});
for(const file of ['demo','palette','charts','graph'])test(`${file}: all widths 1..160, ANSI/plain geometry parity`,()=>{
  const xml=readFileSync(new URL(`../examples/${file}.xml`,import.meta.url),'utf8');
  for(let w=1;w<=160;w++){
    const s=draw(xml,w),lines=s.ansi({colorMode:'16'});
    assert.equal(lines.length,s.height);
    for(let i=0;i<lines.length;i++){const clean=lines[i].replace(esc,'');assert.ok(widthOf(clean)<=w,`${file}: ${w}: ${clean}`);assert.equal(clean,s.plain()[i]);}
  }
});
test('sibling cards stretch to the same bottom edge, without stale interior bottom borders',()=>{
  const s=draw('<Row><Card title="A"><Text>short</Text></Card><Card title="B"><Text>one</Text><Text>two</Text><Text>three</Text></Card></Row>',70);
  assert.equal(s.plain().at(-1).split('╰').length-1,2);assert.ok(s.plain().slice(0,-1).every(l=>!l.includes('╰')));
});
