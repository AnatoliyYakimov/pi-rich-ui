import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderDocument} from '../lib/render.mjs';
import {transformMarkdown,LANGUAGE} from '../lib/parser.mjs';
import {widthOf} from '../lib/surface.mjs';
const example=n=>readFileSync(new URL(`../examples/${n}.xml`,import.meta.url),'utf8');
test('Connector is a safe Markdown root with centered direction and wrapped label',()=>{
  assert.ok(transformMarkdown('<Connector/>').includes(LANGUAGE));
  assert.equal(renderDocument('<Connector/>',9).plain()[0],'    ↓');
  assert.match(renderDocument('<Connector direction="both" label="Доступ к Git"/>',20).plain().join(''),/⇅.*Доступ к Git/);
  assert.throws(()=>renderDocument('<Connector direction="sideways"/>'),/direction/);
});
for(const name of ['layers','boundaries','workflow','decisions'])test(`${name}: complete explanations fit cell budgets with theme-independent structure`,()=>{
  const xml=example(name);
  for(const width of [...Array.from({length:160},(_,i)=>i+1),200,240]){
    const s=renderDocument(xml,width),lines=s.ansi({colorMode:'truecolor'});
    for(const line of lines)assert.ok(widthOf(line.replace(/\x1b\[[\d;]*m/g,''))<=width,`${name}: ${width}`);
    assert.ok(s.height<=400);
    if(width>=24){
      const content=s.plain().join('').replaceAll('│','').replace(/\s/g,'');
      for(const label of name==='layers'?['Permissions','OSsandbox','Micro-VM']:name==='boundaries'?['macOS','credentialproxy','Networkallowlist']:name==='workflow'?['Запрос','Sandbox','Исполнение']:['OSsandbox','Micro-VM','угроз'])assert.ok(content.includes(label),`${name}@${width}: missing ${label}`);
    }
  }
  const mono=renderDocument(xml,80,{monochrome:true}).ansi({colorMode:'none'}).join('\n');assert.ok(!mono.includes('\x1b'));
});
test('nested boundary retains a distinct semantic outline and filled inner cards',()=>{
  const s=renderDocument(example('boundaries'),112);
  assert.ok(s.rows.flat().some(c=>c.role==='success'&&c.g==='╭'));
  assert.ok(s.rows.flat().some(c=>c.background==='subtle'));
  assert.equal((s.plain().join('').match(/╭/g)||[]).length,2);
});
