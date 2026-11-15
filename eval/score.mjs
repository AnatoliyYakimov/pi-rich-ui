import { transformMarkdown } from '../lib/parser.mjs';
import { validateMarkdown } from '../lib/validation.mjs';

/** Structural checks only: facts, readability and whether a visual helps still need human review. */
export function scoreAnswer(testCase, text) {
  if(typeof text!=='string'||!text.trim())throw Error('Answer text must be a nonempty string');
  const tags=new Set();let blocks=0;
  transformMarkdown(text,{pending:false,replace(xml,ast){
    if(ast){blocks++;const visit=n=>{if(typeof n==='string')return;tags.add(n.tag);n.children.forEach(visit);};visit(ast);}
    return xml;
  }});
  const issues=validateMarkdown(text);
  // Match display fence rules rather than counting table examples inside fenced code.
  let fence;const prose=[];
  for(const line of text.split('\n')){
    const match=/^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if(match){if(!fence)fence=match[1];else if(match[1][0]===fence[0]&&match[1].length>=fence.length&&!match[2].trim())fence=undefined;continue;}
    if(!fence)prose.push(line);
  }
  const markdownTable=/^\s*\|?.+\|.+\n\s*\|?\s*:?-{3,}/m.test(prose.join('\n'));
  const visual=blocks>0,validVisual=visual&&issues.length===0;
  const nonTableVisual=validVisual&&['grid','box','connector','sequence','timeline','tree','graph','chart'].some(t=>tags.has(t));
  const matched=issues.length===0&&(testCase.expect==='plain'?!visual&&!markdownTable:
    testCase.expect==='table'?(tags.has('table')||markdownTable):validVisual&&testCase.tags.every(t=>tags.has(t)));
  return {visual,validVisual,nonTableVisual,matched,tags:[...tags].sort(),issues,markdownTable};
}

export function scoreAnswers(cases, answers) {
  const byId=new Map(cases.map(c=>[c.id,c])),seen=new Set(),groups=new Map(),details=[];
  for(const answer of answers){
    const testCase=byId.get(answer.caseId);
    if(!testCase)throw Error(`Unknown caseId: ${answer.caseId}`);
    if(!['baseline','candidate'].includes(answer.variant))throw Error('variant must be baseline or candidate');
    if(typeof answer.model!=='string'||!answer.model.trim())throw Error('model is required');
    const trial=answer.trial??0;
    if(!Number.isInteger(trial)||trial<0)throw Error('trial must be a nonnegative integer');
    const identity=JSON.stringify([answer.variant,answer.model,answer.caseId,trial]);
    if(seen.has(identity))throw Error(`Duplicate answer: ${identity}`);seen.add(identity);
    const result=scoreAnswer(testCase,answer.text),key=JSON.stringify([answer.variant,answer.model]);
    const group=groups.get(key)??{variant:answer.variant,model:answer.model,answers:0,visualOpportunities:0,validVisualsOnOpportunities:0,nonTableVisualsOnOpportunities:0,structureMatches:0,invalidAnswers:0,plainControls:0,unexpectedVisuals:0};
    group.answers++;group.structureMatches+=Number(result.matched);group.invalidAnswers+=Number(result.issues.length>0);
    if(testCase.expect==='visual'){group.visualOpportunities++;group.validVisualsOnOpportunities+=Number(result.validVisual);group.nonTableVisualsOnOpportunities+=Number(result.nonTableVisual);}
    if(testCase.expect==='plain'){group.plainControls++;group.unexpectedVisuals+=Number(result.visual||result.markdownTable||result.issues.length>0);}
    groups.set(key,group);details.push({variant:answer.variant,model:answer.model,caseId:answer.caseId,trial,...result});
  }
  const comparisons=[...new Set(answers.map(a=>a.model))].map(model=>{
    const casesFor=variant=>new Set(details.filter(d=>d.model===model&&d.variant===variant).map(d=>`${d.caseId}:${d.trial}`));
    const baseline=casesFor('baseline'),candidate=casesFor('candidate');
    const paired=[...baseline].filter(key=>candidate.has(key)).length;
    return {model,pairedAnswers:paired,identicalCaseSets:baseline.size>0&&baseline.size===candidate.size&&paired===baseline.size};
  });
  return {note:'Structural checks, not a quality or factual-accuracy benchmark. Compare identical case/trial sets and review answers manually.',comparisons,groups:[...groups.values()],details};
}
