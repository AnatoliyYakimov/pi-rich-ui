import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { GUIDE_CORE, SYSTEM_GUIDE, REFERENCE_PATH, injectGuidance } from '../lib/prompt.mjs';
import { renderDocument } from '../lib/render.mjs';
import { parseDocument, LANGUAGE, transformMarkdown } from '../lib/parser.mjs';

test('English guide prioritizes comprehension over long lists, without demanding visuals for trivial facts',()=>{
  assert.match(GUIDE_CORE,/whenever it improves clarity, understanding or retention/);
  assert.match(GUIDE_CORE,/Prefer visuals to long lists and winding explanations/);
  assert.match(GUIDE_CORE,/Simple facts may stay Markdown/);
  assert.doesNotMatch(GUIDE_CORE,/use sparingly|optional inline|[\p{Script=Cyrillic}\p{Script=Han}]/iu);
});

test('core guide stays within a compact budget without embedding the full reference',()=>{
  assert.ok(GUIDE_CORE.length<=2100);
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

test('four purpose-labeled compositions include a delimiter-safe table',()=>{
  const examples=GUIDE_CORE.split('\n').filter(s=>s.startsWith('<'));
  assert.equal(examples.length,4);
  const tags=examples.map(s=>parseDocument(s).tag);
  assert.deepEqual(tags,['grid','sequence','callout','table']);
  for(const xml of examples){
    assert.match(transformMarkdown(xml),new RegExp(LANGUAGE));
    for(const width of [24,40,80])assert.ok(renderDocument(xml,width).plain().length>0);
  }
  const cards=parseDocument(examples[0]).children.filter(n=>typeof n!=='string');
  assert.equal(cards.length,2);
  const steps=parseDocument(examples[1]).children.filter(n=>typeof n!=='string');
  assert.equal(steps.length,2); // Demonstrates an interaction, not just one isolated node.
  const table=parseDocument(examples[3]);
  assert.equal(table.attrs.headers,'Service|Status');
  assert.equal(table.children[0].children[1].children[0],'Healthy, no errors');
  assert.match(GUIDE_CORE,/arrays.*unsupported/i);
  assert.match(GUIDE_CORE,/not CSV/);
  assert.match(GUIDE_CORE,/never.*reserved.*fence/i);
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
