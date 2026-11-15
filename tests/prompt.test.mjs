import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { GUIDE_CORE, SYSTEM_GUIDE, REFERENCE_PATH, injectGuidance } from '../lib/prompt.mjs';
import { renderDocument } from '../lib/render.mjs';
import { parseDocument, LANGUAGE, transformMarkdown } from '../lib/parser.mjs';
import { RECIPES } from '../lib/recipes.mjs';
import { validateMarkdown } from '../lib/validation.mjs';
import { widthOf } from '../lib/surface.mjs';

test('English guide prioritizes comprehension over long lists, without demanding visuals for trivial facts',()=>{
  assert.match(GUIDE_CORE,/whenever it improves clarity, understanding or retention/);
  assert.match(GUIDE_CORE,/Prefer visuals to long lists and winding explanations/);
  assert.match(GUIDE_CORE,/Simple facts may stay Markdown/);
  assert.doesNotMatch(GUIDE_CORE,/use sparingly|optional inline|[\p{Script=Cyrillic}\p{Script=Han}]/iu);
});

test('core guide stays within a compact budget without embedding the full reference',()=>{
  assert.ok(Buffer.byteLength(GUIDE_CORE,'utf8')<=6800);
  assert.ok(!SYSTEM_GUIDE.includes(readFileSync(REFERENCE_PATH,'utf8')));
  assert.match(GUIDE_CORE,/never invent data; label illustrative data/);
  assert.match(GUIDE_CORE,/OUTSIDE fences/);
  assert.match(GUIDE_CORE,/No JS\/CSS\/events/);
});

test('advanced reference resolves to the installed module, not the user project directory',()=>{
  assert.ok(isAbsolute(REFERENCE_PATH));
  assert.equal(SYSTEM_GUIDE.slice(GUIDE_CORE.length),`\nAdvanced props: read ${JSON.stringify(REFERENCE_PATH)} only when needed.`);
  const reference=readFileSync(REFERENCE_PATH,'utf8');
  for(const attr of ['titlePosition','borderTone','Table.Column','zeroLine'])assert.ok(reference.includes(attr));
});

test('all model-visible recipes validate and preserve terminal width budgets',()=>{
  const examples=GUIDE_CORE.split('\n').filter(s=>s.startsWith('<'));
  assert.deepEqual(examples,RECIPES.map(r=>r.xml));
  assert.equal(examples.length,10);
  for(const xml of examples){
    assert.match(transformMarkdown(xml),new RegExp(LANGUAGE));
    assert.deepEqual(validateMarkdown(xml),[]);
    for(const width of [24,40,80,112]){
      const rendered=renderDocument(xml,width);
      assert.ok(rendered.plain().length>0);
      assert.ok(rendered.plain().every(line=>widthOf(line)<=width));
      assert.ok(rendered.height<400);
    }
  }
  const boundary=parseDocument(RECIPES.find(r=>r.id==='boundary').xml).children.find(n=>n.tag==='box');
  assert.ok(boundary.children.some(n=>n.tag==='card'));
  assert.ok(boundary.children.some(n=>n.tag==='grid'));
  const table=parseDocument(RECIPES.find(r=>r.id==='records').xml);
  assert.equal(table.attrs.headers,'Service|Status');
  assert.equal(table.children[0].children[1].children[0],'Healthy, no errors');
  assert.equal(table.children[0].children[0].attrs.bold,true);
  assert.ok(table.children[1].children[1].children.some(n=>n.tag==='span'&&n.attrs.bold));
  assert.match(GUIDE_CORE,/arrays.*unsupported/i);
  assert.match(GUIDE_CORE,/not CSV/);
  assert.match(GUIDE_CORE,/never.*reserved.*fence/i);
});

test('selection guidance teaches task-to-composition mapping and respects explicit user preferences',()=>{
  for(const phrase of ['without waiting for the user to ask','containment -> nested boundaries','exchanges -> Sequence','chronology -> Timeline','hierarchy -> Tree','branching dependencies -> Graph','observations -> Chart','not as the default for every comparison','Respect an explicit request for prose, code or a table','Never fabricate measurements'])assert.ok(GUIDE_CORE.includes(phrase),phrase);
});

test('screenshot-shaped compositions retain their labels and real containment',()=>{
  const vps=parseDocument(RECIPES.find(r=>r.id==='vps').xml);
  const grid=vps.children.find(n=>n.tag==='grid');
  assert.equal(grid.children.filter(n=>n.tag==='card').length,2);
  for(const [id,labels] of [['vps',['NaiveProxy','Hysteria2','TCP/443','UDP/443']],['site-sketch',["John's Works",'Projects','Engineering Notes']]]){
    for(const width of [40,80,112]){
      const text=renderDocument(RECIPES.find(r=>r.id===id).xml,width).plain().join('').replaceAll('│','').replace(/\s/g,'');
      for(const label of labels)assert.ok(text.includes(label.replace(/\s/g,'')),`${id}@${width}: ${label}`);
    }
  }
});

test('forced prompt injection preserves earlier instructions and deduplicates after Pi applies the result',()=>{
  for(const forced of ['Existing prompt\n\n## Memory\nSnapshot','']){
    const options={forceSystemPrompt:forced,promptGuidelines:['Unrelated guideline',SYSTEM_GUIDE]};
    const event={systemPromptOptions:options,get systemPrompt(){return options.forceSystemPrompt;}};
    const result=injectGuidance(event);
    assert.equal(result?.systemPrompt,forced+'\n\n'+SYSTEM_GUIDE);
    assert.deepEqual(options.promptGuidelines,['Unrelated guideline',SYSTEM_GUIDE]);
    // Pi's event runner applies a returned systemPrompt as the next forced prompt.
    options.forceSystemPrompt=result.systemPrompt;
    assert.equal(injectGuidance(event),undefined);
  }
});

test('forced prompt already containing guidance is left unchanged',()=>{
  const options={forceSystemPrompt:'Existing prompt\n\n'+SYSTEM_GUIDE,promptGuidelines:[]};
  const event={systemPrompt:options.forceSystemPrompt,systemPromptOptions:options};
  assert.equal(injectGuidance(event),undefined);
  assert.deepEqual(options.promptGuidelines,[]);
});

test('disabled injection leaves forced prompts and structured options unchanged',()=>{
  const event={systemPrompt:'Existing prompt',systemPromptOptions:{forceSystemPrompt:'Existing prompt',promptGuidelines:[]}};
  const before=structuredClone(event);
  assert.equal(injectGuidance(event,false),undefined);
  assert.deepEqual(event,before);
});

test('structured and legacy injection add exactly the same guide and preserve other instructions',()=>{
  const event={systemPromptOptions:{promptGuidelines:['Unrelated guideline']}};
  injectGuidance(event);injectGuidance(event);
  assert.deepEqual(event.systemPromptOptions.promptGuidelines,['Unrelated guideline',SYSTEM_GUIDE]);
  const legacy=injectGuidance({systemPrompt:'Existing prompt'});
  assert.equal(legacy.systemPrompt,'Existing prompt\n\n'+SYSTEM_GUIDE);
  assert.equal(injectGuidance(legacy),undefined);
});
