import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateMarkdown } from '../lib/validation.mjs';
import { renderDocument, getDocument } from '../lib/render.mjs';

test('released feedback validator accepts explanatory compositions without mutating reused ASTs',()=>{
  for(const name of ['layers','boundaries','workflow','decisions']){
    const xml=readFileSync(new URL(`../examples/${name}.xml`,import.meta.url),'utf8');
    // structuredClone normalizes the parser's null-prototype attribute maps.
    const ast=getDocument(xml),before=JSON.stringify(ast);
    assert.deepEqual(validateMarkdown(xml),[],name);
    for(const width of [24,80,112])renderDocument(ast,width,{monochrome:true});
    assert.equal(JSON.stringify(ast),before,name);
  }
});
test('Connector validation shares rendering semantics and reports the original outer root',()=>{
  for(const direction of ['down','up','both'])assert.deepEqual(validateMarkdown(`<Connector direction="${direction}" label="Git access"/>`),[]);
  for(const [xml,tag] of [['<Connector direction="sideways"/>','Connector'],['<UI><Card>Host</Card><Connector direction="sideways"/></UI>','UI']]){
    const issues=validateMarkdown('Before\n'+xml);
    assert.equal(issues.length,1);
    assert.equal(issues[0].line,2);
    assert.equal(issues[0].tag,tag);
    assert.match(issues[0].message,/Connector direction/);
  }
});
test('feedback surfaces invalid new presentation attributes instead of silently accepting them',()=>{
  for(const [xml,error] of [['<Card surface="bogus">X</Card>',/surface/],['<Box><Card width="full">X</Card></Box>',/root/]]){
    const issues=validateMarkdown(xml);
    assert.equal(issues.length,1);
    assert.match(issues[0].message,error);
  }
});
