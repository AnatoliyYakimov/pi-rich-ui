import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderDocument } from '../lib/render.mjs';
import { parseDocument, transformMarkdown, LANGUAGE } from '../lib/parser.mjs';
import { containerStyle, containerInsets } from '../lib/containers.mjs';
import { Surface, widthOf } from '../lib/surface.mjs';
const plain=(xml,w=60)=>renderDocument(xml,w).plain().join('\n');
const count=(s,text)=>s.split(text).length-1;
const roleFor=(surface,text)=>{const y=surface.plain().findIndex(l=>l.includes(text));return surface.rows[y].find(c=>c.g===text[0])?.role;};

for(const position of ['inside','above','border','none'])test(`heading ${position} has independent placement`,()=>{
 const s=renderDocument(`<Card title="HEADING" titlePosition="${position}"><Text>BODY</Text></Card>`,40),lines=s.plain();
 if(position==='none')assert.ok(!lines.join('').includes('HEADING'));
 else{assert.equal(count(lines.join(''),'HEADING'),1);const hy=lines.findIndex(l=>l.includes('HEADING')),fy=lines.findIndex(l=>l.includes('╭'));
  assert.equal(position==='above',hy<fy);assert.equal(position==='border',hy===fy);if(position==='inside')assert.ok(hy>fy);
 }
 assert.ok(lines.join('').includes('BODY'));
});
for(const border of ['rounded','single','left','none'])test(`border ${border} changes geometry without losing title`,()=>{
 const s=plain(`<Card title="Title" border="${border}"><Text>Body</Text></Card>`);
 assert.ok(s.includes('Title')&&s.includes('Body'));assert.equal(s.includes('╭'),border==='rounded');assert.equal(s.includes('┌'),border==='single');assert.equal(s.includes('▎'),border==='left');
});
test('Card content heading and Box edge heading are deliberate defaults',()=>{
 assert.match(plain('<Box title="Box"><Text>x</Text></Box>').split('\n')[0],/Box/);
 assert.ok(!plain('<Card title="Card"><Text>x</Text></Card>').split('\n')[0].includes('Card'));
});
test('title-less Box has no invented heading or label',()=>{
 const lines=plain('<Box><Text>Statement</Text></Box>').split('\n');assert.ok(/^╭─+╮$/.test(lines[0]));assert.match(lines.join(''),/Statement/);
});
test('boolean border=false and explicit none are identical',()=>assert.equal(plain('<Card title="Title" border={false}><Text>x</Text></Card>'),plain('<Card title="Title" border="none"><Text>x</Text></Card>')));
test('long edge titles move above frame and preserve the full wording',()=>{
 const title='A deliberately long title ending TOKEN',lines=plain(`<Box title="${title}"><Text>Body</Text></Box>`,22).split('\n');
 const border=lines.findIndex(l=>l.includes('╭'));assert.ok(lines.slice(0,border).join(' ').includes('TOKEN'));assert.ok(!lines.join('').includes('…'));
});
test('multiline titles and Unicode are not cut by frame decoration',()=>{
 const lines=plain('<Card title="Architecture&#10;Dependencies 汉字"><Text>x</Text></Card>',24);assert.match(lines,/Dependencies/);assert.match(lines,/汉字/);
});
test('left and none edge titles become content headings, not lost labels',()=>{
 for(const border of ['left','none']){const s=plain(`<Box border="${border}" title="LABEL"><Text>BODY</Text></Box>`);assert.equal(count(s,'LABEL'),1);assert.ok(s.indexOf('LABEL')<s.indexOf('BODY'));}
});
test('explicit title suppression retains the body',()=>{
 const s=plain('<Box title="hidden" titlePosition="none"><Text>visible</Text></Box>');assert.ok(!s.includes('hidden'));assert.match(s,/visible/);
});
test('invalid design enums fail safely instead of doing unintended layouts',()=>{
 for(const xml of ['<Box border="double"/>','<Card titlePosition="floating"/>'])assert.throws(()=>plain(xml));
});
test('borderTone/titleTone do not recolor body prose',()=>{
 const s=renderDocument('<Card title="HEADER" borderTone="red" titleTone="purple"><Text>BODY</Text></Card>',40);
 assert.equal(s.rows[0][0].role,'error');assert.equal(roleFor(s,'HEADER'),'purple');assert.equal(roleFor(s,'BODY'),'text');
});
test('semantic status can inherit while ordinary prose stays neutral',()=>{
 const s=renderDocument('<Card tone="warning" title="State"><Text>BODY</Text><Badge>CHECK</Badge><Metric label="Count" value={8}/></Card>',40);
 assert.equal(s.rows[0][0].role,'warning');assert.equal(roleFor(s,'BODY'),'text');assert.ok(s.rows.flat().some(c=>c.g==='8'&&c.role==='warning'));
});
test('btop default accents inherit actual Pi theme, not hard-coded RGB',()=>{
 const seen=[];const s=renderDocument('<Card title="Hello"><Text>Body</Text></Card>',30);s.ansi({theme:{fg:(token,text)=>{seen.push(token);return text;}}});assert.ok(seen.includes('accent'));assert.ok(!seen.includes('borderMuted'));
});
test('content headings wrap and preserve inline icon labels',()=>{
 const s=plain('<Card icon="database" title="Long database title END"><Text>Body</Text></Card>',20);assert.match(s,/▤/);assert.match(s,/END/);
});
test('Callout has a rail, optional title and no enclosing frame',()=>{
 const s=plain('<Callout title="Caveat" tone="warning"><Text>Context</Text></Callout>');assert.match(s,/▎/);assert.match(s,/Caveat/);assert.ok(!s.includes('╭'));
 const t=plain('<Callout><Text>Short caveat</Text></Callout>');assert.match(t,/Short caveat/);assert.ok(!t.includes('Caveat'));
});
test('Callout is a recognized standalone streaming Markdown root',()=>{
 assert.ok(transformMarkdown('<Callout><Text>x</Text></Callout>').includes(LANGUAGE));assert.ok(transformMarkdown('<Callout><Text>x',{isStreaming:true}).includes('Rendering visual'));
 const literal='```xml\n<Callout><Text>x</Text></Callout>\n```';assert.equal(transformMarkdown(literal),literal);
});
for(const border of ['rounded','single','left','none'])for(const position of ['inside','above','border'])test(`stretch preserves ${border} with heading ${position}`,()=>{
 const xml=`<Row><Card border="${border}" title="ONE" titlePosition="${position}"><Text>x</Text></Card><Card border="${border}" title="TWO" titlePosition="${position}"><Text>a</Text><Text>b</Text><Text>c</Text></Card></Row>`;
 const lines=plain(xml,80).split('\n'),s=lines.join('\n');assert.equal(count(s,'ONE'),1);assert.equal(count(s,'TWO'),1);
 if(border==='rounded'){assert.equal(count(lines.at(-1),'╰'),2);assert.ok(lines.slice(0,-1).every(l=>!l.includes('╰')));}
 if(border==='single'){assert.equal(count(lines.at(-1),'└'),2);assert.ok(lines.slice(0,-1).every(l=>!l.includes('└')));}
 if(border==='left')assert.ok(!s.includes('╭'));
});
test('narrow container degrades decoration and preserves heading and body',()=>{
 for(let w=1;w<8;w++){const s=plain('<Card title="END"><Text>BODY</Text></Card>',w).replaceAll('\n','');assert.ok(s.includes('END'));assert.ok(s.includes('BODY'));}
});
test('table headers use accent while vertical rules are optional',()=>{
 const xml='<Table headers="Name,State"><Tr values="API,healthy"/></Table>';
 const s=renderDocument(xml,50);assert.ok(!s.plain().join('').includes('│'));assert.ok(s.rows[0].some(c=>c.role==='accent'&&c.bold));
 assert.match(plain(xml.replace('<Table ','<Table columnSeparators ')),/│/);
});
test('numeric metrics have bright bold values and optional semantic delta',()=>{
 const s=renderDocument('<Metric label="Requests" value={600} delta="+12%"/>',30);assert.equal(s.rows[1][0].role,'text');assert.ok(s.rows[1][0].bold);assert.match(s.plain().join('\n'),/\+12%/);
});
test('each supported density affects frame-free content too',()=>{
 const compact=renderDocument('<Card density="compact" border={false}><Text>A</Text><Text>B</Text></Card>',30),spacious=renderDocument('<Card density="spacious" border={false}><Text>A</Text><Text>B</Text></Card>',30);assert.ok(compact.height<spacious.height);
});
test('narrow intrinsic sizing accounts for border-less and rail insets',()=>{
 assert.equal(containerInsets(parseDocument('<Box padding={0} border={false}/>')),0);assert.equal(containerInsets(parseDocument('<Callout padding={1}/>')),3);
});
test('square frame primitive remains width-correct',()=>{
 const s=new Surface(20,3);s.frame(0,0,20,3,'cyan','Heading','single');assert.match(s.plain()[0],/^┌/);assert.match(s.plain().at(-1),/^└/);
});
for(const name of ['compare','architecture','components','titles','dashboard'])test(`${name}: actual new compositions at widths 1..160`,()=>{
 const xml=readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8');
 for(let w=1;w<=160;w++){
  const s=renderDocument(xml,w),lines=s.ansi({colorMode:'truecolor'}),plain=s.plain();assert.ok(s.height<=400);
  lines.forEach((l,i)=>{const clean=l.replace(/\x1b\[[\d;]*m/g,'');assert.equal(clean,plain[i]);assert.ok(widthOf(clean)<=w,`${name} ${w}: ${clean}`);});
 }
});
test('real discussion examples preserve their decision and architecture wording',()=>{
 for(const [file,required]of [['compare',['PNG','Current direction','presentation']],['architecture',['Parser','history','internal Markdown API']],['components',['Relationships','comparisons','design']]]){
  const text=plain(readFileSync(new URL(`../examples/${file}.xml`,import.meta.url),'utf8'),80).toLowerCase();for(const part of required)assert.ok(text.includes(part.toLowerCase()),part);
 }
});

test('a zero delta remains visible instead of being dropped as falsy',()=>{
 const s=renderDocument('<Metric label="Changes" value={2} delta={0}/>',30).plain();assert.equal(s[2],'0');
});
