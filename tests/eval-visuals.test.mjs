import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { requests } from '../scripts/eval-visuals.mjs';
import { scoreAnswer, scoreAnswers } from '../eval/score.mjs';
import { RECIPES } from '../lib/recipes.mjs';
const cases=JSON.parse(readFileSync(new URL('../eval/cases.json',import.meta.url),'utf8'));
const example=id=>RECIPES.find(r=>r.id===id).xml;

test('A/B export keeps the same unprompted questions and does not leak expected structures',()=>{
  const rows=requests(2);
  assert.equal(rows.length,cases.length*4);
  assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
  for(const c of cases){
    const pair=rows.filter(r=>r.caseId===c.id&&r.trial===0);
    assert.deepEqual(pair.map(r=>r.variant),['baseline','candidate']);
    assert.deepEqual(pair.map(r=>r.prompt),[c.prompt,c.prompt]);
    assert.notEqual(pair[0].systemPrompt,pair[1].systemPrompt);
    for(const r of pair)assert.deepEqual(Object.keys(r).sort(),['caseId','prompt','systemPrompt','trial','variant']);
  }
  assert.deepEqual(rows.filter(r=>r.trial===1).slice(0,2).map(r=>r.variant),['candidate','baseline']);
  for(const trials of [0,-1,1.5,21,NaN])assert.throws(()=>requests(trials),/trials/);
});

test('scorer distinguishes a chosen composition from omission, table substitution and fenced XML',()=>{
  const c=cases.find(c=>c.id==='network-peers');
  assert.equal(scoreAnswer(c,example('vps')).matched,true);
  assert.equal(scoreAnswer(c,'Both services can coexist.').matched,false);
  const table=scoreAnswer(c,example('records'));
  assert.equal(table.validVisual,true);assert.equal(table.nonTableVisual,false);assert.equal(table.matched,false);
  assert.equal(scoreAnswer(c,'```xml\n'+example('vps')+'\n```').visual,false);
  assert.equal(scoreAnswer(c,'<UI><Card>Missing closing tags').matched,false);
  const invalid=scoreAnswer(c,'<Table headers="A"><Tr values="1,2"/></Table>');
  assert.equal(invalid.validVisual,false);assert.ok(invalid.issues.length);
});

test('plain/code controls and explicit tables are scored independently of visual adoption',()=>{
  const plain=cases.find(c=>c.expect==='plain'),table=cases.find(c=>c.expect==='table');
  assert.equal(scoreAnswer(plain,'1024 bytes.').matched,true);
  assert.equal(scoreAnswer(plain,example('vps')).matched,false);
  const md='| A | B |\n| --- | --- |\n| 1 | 2 |';
  assert.equal(scoreAnswer(plain,md).matched,false);
  assert.equal(scoreAnswer(table,md).matched,true);
  assert.equal(scoreAnswer(table,'```md\n'+md+'\n```').matched,false);
  assert.equal(scoreAnswer(table,example('records')).matched,true);
  assert.throws(()=>scoreAnswer(plain,''),/nonempty/);
});

test('paired reporting rejects duplicate samples and exposes incomplete comparisons',()=>{
  const a={caseId:'network-peers',variant:'baseline',model:'fixture',text:example('records')};
  const b={...a,variant:'candidate',text:example('vps')};
  const report=scoreAnswers(cases,[a,b]);
  assert.equal(report.comparisons[0].identicalCaseSets,true);
  assert.equal(report.groups[0].nonTableVisualsOnOpportunities,0);
  assert.equal(report.groups[1].nonTableVisualsOnOpportunities,1);
  assert.equal(report.groups[1].structureMatches,1);
  assert.equal(scoreAnswers(cases,[a]).comparisons[0].identicalCaseSets,false);
  assert.throws(()=>scoreAnswers(cases,[a,a]),/Duplicate/);
  assert.throws(()=>scoreAnswers(cases,[{...a,caseId:'unknown'}]),/Unknown caseId/);
  assert.throws(()=>scoreAnswers(cases,[{...a,variant:'other'}]),/variant/);
});

test('export CLI produces only parseable request JSONL',()=>{
  const lines=execFileSync(process.execPath,[new URL('../scripts/eval-visuals.mjs',import.meta.url).pathname,'export'],{encoding:'utf8'}).trimEnd().split('\n');
  assert.equal(lines.length,cases.length*2);
  assert.ok(lines.every(line=>JSON.parse(line).systemPrompt));
});
