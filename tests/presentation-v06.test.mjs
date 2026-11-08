import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDocument, getDocument } from '../lib/render.mjs';
import { widthOf } from '../lib/surface.mjs';
const plain=(xml,w=160)=>renderDocument(xml,w).plain().join('\n');
const corners=s=>(s.match(/╭/g)||[]).length;
test('root budget defaults to readable measure and full or numeric root can request more',()=>{
  assert.equal(renderDocument('<Box><Text>Body</Text></Box>',240).width,112);
  assert.equal(renderDocument('<Box width="full"><Text>Body</Text></Box>',240).width,240);
  assert.equal(renderDocument('<Box width={160}><Text>Body</Text></Box>',240).width,160);
  assert.equal(renderDocument('<Box maxWidth={40}><Text>Body</Text></Box>',240).width,40);
  assert.throws(()=>plain('<Box><Box width="full"/></Box>'),/root/);
});
test('automatic sections are framed once and explicit decorations remain independent',()=>{
  assert.equal(corners(plain('<Table headers="A"><Tr values="B"/></Table>')),1);
  assert.equal(corners(plain('<Table border={false} surface="none" headers="A"><Tr values="B"/></Table>')),0);
  assert.equal(corners(plain('<Card><Text>X</Text></Card>')),1);
  assert.equal(corners(plain('<Grid cols={2}><Card>X</Card><Card>Y</Card></Grid>')),2);
  assert.equal(corners(plain('<UI><Card>X</Card><Card>Y</Card></UI>')),3);
  assert.equal(corners(plain('<Row><Col><Text>X</Text></Col></Row>')),0);
});
test('short automatic panels preserve contours when the terminal has room',()=>{
  for(const [attrs,corner] of [['','╭'],['border="single"','┌']]){
    const s=renderDocument(`<Metric label="A" value={1} ${attrs}/>`,80);
    assert.match(s.ansi({colorMode:'none'}).join('\n'),new RegExp(corner));
    assert.ok(s.width<20);
  }
  const grid=plain('<Grid cols={3} minWidth={18}><Metric label="A" value={1}/><Metric label="B" value={2}/><Metric label="C" value={3}/></Grid>',60);
  assert.equal(corners(grid),3);
  assert.ok(grid.split('\n').some(l=>l.includes('A')&&l.includes('C')));
  assert.doesNotMatch(plain('<Metric label="A" value={1}/>',6),/[╭┌]/);
  assert.doesNotMatch(plain('<Metric label="A" value={1} border={false}/>',80),/[╭┌]/);
  assert.equal(renderDocument('<Metric label="A" value={1} border={false} padding={0}/>',80).width,1);
});
test('sizing works on root and nested blocks without exceeding parent budget',()=>{
  const xml='<Col maxWidth={18}><Box maxWidth={12}><Text>ABCDEFGHIJKLMNO</Text></Box></Col>';
  const s=renderDocument(xml,160);assert.equal(s.width,18);
  assert.ok(s.plain().every(l=>widthOf(l)<=12));
  const n=renderDocument('<Box maxWidth={70}><Box minWidth={100} maxWidth={100}>X</Box></Box>',30);
  assert.ok(n.plain().every(l=>widthOf(l)<=30));
});
test('short tables keep columns and the enclosing panel compact at wide budgets',()=>{
  const xml='<Table headers="Service,RPS,p99"><Tr values="API,600,25 ms"/><Tr values="Orders,450,180 ms"/></Table>';
  for(const w of [160,240]){
    const s=renderDocument(xml,w),line=s.plain().find(l=>l.includes('Service'));
    assert.ok(line.indexOf('RPS')<24,line);assert.ok(s.width<50);
  }
  const raw=renderDocument('<Table><Column label="Name" flex={1}/><Tr values="API"/></Table>',80,{presentation:false});assert.equal(raw.width,80);
});
test('numeric diff sections stay adjacent after their frame shrinks',()=>{
  const s=renderDocument('<Row><Diff label="Latency" before={600} after={120} unit="ms"/><Diff label="Throughput" before={450} after={900} unit="RPS"/></Row>',160);
  const line=s.plain().find(l=>l.includes('Latency')&&l.includes('Throughput'));
  assert.ok(line);assert.ok(line.indexOf('Throughput')<40,line);
});
test('short split diff has content-sized equal halves while long lines use available room',()=>{
  const short=renderDocument('<Diff mode="split"><Before>x: 1</Before><After>x: 2</After></Diff>',160,{presentation:false});
  assert.ok(short.width<60);assert.match(short.plain().join(''),/│/);
  const long=renderDocument(`<Diff mode="split"><Before>${'x'.repeat(200)}</Before><After>${'y'.repeat(200)}</After></Diff>`,100,{presentation:false});assert.equal(long.width,100);
});
test('presentation never mutates cached source or adds another frame on repeat rendering',()=>{
  const xml='<UI><Table headers="A"><Tr values="B"/></Table></UI>';
  const before=JSON.stringify(getDocument(xml)),a=plain(xml,80),b=plain(xml,80);
  assert.equal(a,b);assert.equal(JSON.stringify(getDocument(xml)),before);
});
test('short metrics and their wrappers stay adjacent instead of filling the row',()=>{
  const s=renderDocument('<Row><Card><Metric label="A" value={1}/></Card><Card><Metric label="B" value={2}/></Card></Row>',160);
  const line=s.plain().find(l=>l.includes('A')&&l.includes('B'));
  assert.ok(line);assert.ok(line.indexOf('B')<40,line);
});
