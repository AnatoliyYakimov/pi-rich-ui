import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { GUIDE_CORE, REFERENCE_PATH } from '../lib/prompt.mjs';
import { scoreAnswers } from '../eval/score.mjs';

const cases=JSON.parse(readFileSync(new URL('../eval/cases.json',import.meta.url),'utf8'));
export function requests(trials=1) {
  if(!Number.isInteger(trials)||trials<1||trials>20)throw Error('trials must be 1..20');
  const baseline=readFileSync(new URL('../eval/baseline-guide.txt',import.meta.url),'utf8').trimEnd();
  const suffix=`\nAdvanced props: read ${JSON.stringify(REFERENCE_PATH)} only when needed.`;
  const rows=[];
  for(let trial=0;trial<trials;trial++)for(const c of cases){
    // Alternate order to reduce a fixed baseline-first execution bias.
    for(const variant of trial%2?['candidate','baseline']:['baseline','candidate'])
      rows.push({caseId:c.id,variant,trial,systemPrompt:(variant==='baseline'?baseline:GUIDE_CORE)+suffix,prompt:c.prompt});
  }
  return rows;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try {
    const [command,input]=process.argv.slice(2);
    if(command==='export')process.stdout.write(requests(input===undefined?1:Number(input)).map(r=>JSON.stringify(r)).join('\n')+'\n');
    else if(command==='score'&&input){
      const answers=readFileSync(input,'utf8').split('\n').filter(l=>l.trim()).map((line,index)=>{
        try{return JSON.parse(line);}catch{throw Error(`Invalid JSON on answer line ${index+1}`);}
      });
      if(!answers.length)throw Error('No answers to score');
      process.stdout.write(JSON.stringify(scoreAnswers(cases,answers),null,2)+'\n');
    }else throw Error('Usage: npm run eval:visuals -- export [trials=1] | score <answers.jsonl>');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
