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
  assert.ok(GUIDE_CORE.length<=1700);
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

test('three purpose-labeled compositions parse and render, rather than eight isolated tags',()=>{
  const examples=GUIDE_CORE.split('\n').filter(s=>s.startsWith('<'));
  assert.equal(examples.length,3);
  const tags=examples.map(s=>parseDocument(s).tag);
  assert.deepEqual(tags,['grid','sequence','callout']);
  for(const xml of examples){
    assert.match(transformMarkdown(xml),new RegExp(LANGUAGE));
    for(const width of [24,40,80])assert.ok(renderDocument(xml,width).plain().length>0);
  }
  const cards=parseDocument(examples[0]).children.filter(n=>typeof n!=='string');
  assert.equal(cards.length,2);
  const steps=parseDocument(examples[1]).children.filter(n=>typeof n!=='string');
  assert.equal(steps.length,2); // Demonstrates an interaction, not just one isolated node.
});

test('structured and legacy injection add exactly the same guide and preserve other instructions',()=>{
  const event={systemPromptOptions:{promptGuidelines:['Unrelated guideline']}};
  injectGuidance(event);injectGuidance(event);
  assert.deepEqual(event.systemPromptOptions.promptGuidelines,['Unrelated guideline',SYSTEM_GUIDE]);
  const legacy=injectGuidance({systemPrompt:'Existing prompt'});
  assert.equal(legacy.systemPrompt,'Existing prompt\n\n'+SYSTEM_GUIDE);
  assert.equal(injectGuidance(legacy),undefined);
});
