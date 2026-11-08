import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../lib/feedback.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const bad='<Table headers={["Service","Status"]}/>';
const message=(id,role,content)=>({id,parentId:null,timestamp:'2026-11-08T00:00:00Z',type:'message',message:{role,content:[{type:'text',text:content}],...(role==='assistant'?{stopReason:'stop'}:{}),timestamp:1}});
function fixture({text=bad,branch,projected}={}){
  branch??=[message('u1','user','Show status'),message('a1','assistant',text)];
  projected??=branch.filter(e=>e.type==='message').map(e=>({sourceEntry:e,messages:[e.message]}));
  const notices=[];
  const event={type:'agent_before_settle',outcome:'completed',entries:[],continue:false,context:{contextEntries:projected,contextMessages:projected.flatMap(e=>e.messages),pendingMessages:[],llmMessages:[],canContinue:false}};
  const ctx={sessionManager:{getBranch:()=>branch,getSessionId:()=> 'session-1'}};
  assert.equal(typeof api.createFeedbackHandler,'function');
  const handler=api.createFeedbackHandler({enabled:()=>true,notify:(_ctx,...args)=>notices.push(args)});
  return {branch,event,ctx,handler,notices};
}
const persist=(f,result)=>{
  const draft=result.entries.at(-1);
  f.branch.push({...draft,id:'diagnostic',parentId:'a1',timestamp:'2026-11-08T00:00:00Z'});
};
const finalAnswer=(f,id,text)=>{
  const entry=message(id,'assistant',text);
  f.branch.push(entry);
  f.event.context.contextEntries.push({sourceEntry:entry,messages:[entry.message]});
  f.event.context.contextMessages.push(entry.message);
};

test('invalid final answer adds model feedback without rewriting original history',()=>{
  const f=fixture(), prior={type:'custom',customType:'another-extension',data:{ok:true}};
  f.event.entries.push(prior);
  const result=f.handler(f.event,f.ctx);
  assert.equal(result.continue,true);
  assert.equal(result.entries.length,2);
  assert.equal(result.entries[0],prior);
  const diagnostic=result.entries[1];
  assert.equal(diagnostic.type,'custom_message');
  assert.equal(diagnostic.customType,'pi-rich-ui-validation');
  assert.equal(diagnostic.display,false);
  assert.deepEqual(diagnostic.details,{version:1,requestEntryId:'u1',assistantEntryId:'a1'});
  assert.match(diagnostic.content,/Only scalar literals/);
  assert.equal(f.branch[1].message.content[0].text,bad);
  assert.equal(f.notices.length,1);
});

test('valid answers and literal examples do not request correction',()=>{
  for(const text of ['<Text>OK</Text>','```xml\n'+bad+'\n```','Plain text']){
    const f=fixture({text});
    assert.equal(f.handler(f.event,f.ctx),undefined);
    assert.deepEqual(f.notices,[]);
  }
});

test('one attempt survives repeated callbacks and warns once for invalid correction',()=>{
  const f=fixture(),result=f.handler(f.event,f.ctx);
  assert.equal(f.handler(f.event,f.ctx),undefined);
  assert.equal(f.notices.length,1); // Same answer is not yet a failed correction.
  persist(f,result);
  finalAnswer(f,'a2',bad);
  assert.equal(f.handler(f.event,f.ctx),undefined);
  assert.equal(f.handler(f.event,f.ctx),undefined);
  assert.equal(f.notices.length,2);
  assert.match(f.notices[1][0],/stopped/);
});

test('fresh handlers reconstruct the spent budget from persisted diagnostic metadata',()=>{
  const first=fixture();
  persist(first,first.handler(first.event,first.ctx));
  for(const corrected of [false,true]){
    const branch=structuredClone(first.branch);
    if(corrected)branch.push(message('a2','assistant',bad));
    const next=fixture({branch});
    assert.equal(next.handler(next.event,next.ctx),undefined);
  }
});

test('new real user entries have independent budgets even with identical text',()=>{
  const f=fixture();
  persist(f,f.handler(f.event,f.ctx));
  const newUser=message('u2','user','Show status');
  f.branch.push(newUser);
  f.event.context.contextEntries.push({sourceEntry:newUser,messages:[newUser.message]});
  f.event.context.contextMessages.push(newUser.message);
  finalAnswer(f,'a2',bad);
  assert.equal(f.handler(f.event,f.ctx)?.entries.at(-1).details.requestEntryId,'u2');
});

test('non-completed, pending, and already continuing boundaries are untouched',()=>{
  for(const mutate of [
    f=>f.event.outcome='aborted',f=>f.event.outcome='error',f=>f.event.continue=true,
    f=>f.event.context.pendingMessages.push({role:'user',content:'new request'}),
    f=>f.event.context.contextMessages.at(-1).stopReason='error',
    f=>f.event.context.contextMessages.at(-1).stopReason='aborted',
    f=>f.event.context.contextMessages.at(-1).content.push({type:'toolCall',id:'t',name:'read',arguments:{}}),
    f=>f.event.context.contextMessages.at(-1).content=[{type:'thinking',thinking:bad}],
    f=>f.event.context.contextMessages.push({role:'custom',customType:'another-extension',content:'Continue'}),
    f=>delete f.event.context.contextEntries,
    f=>delete f.ctx.sessionManager,
    f=>f.ctx.sessionManager.getBranch=()=>{throw Error('unavailable');},
  ]){
    const f=fixture();mutate(f);
    assert.equal(f.handler(f.event,f.ctx),undefined);
    assert.deepEqual(f.notices,[]);
  }
});

test('context edits and missing persisted provenance fail closed',()=>{
  for(const mutate of [
    f=>f.branch.push({type:'context_edit',id:'edit',targetId:'a1',replacement:{content:'replaced'}}),
    f=>f.event.entries.push({type:'context_edit',targetId:'u1',replacement:null}),
    f=>f.branch.splice(0,1),
    f=>f.event.context.contextEntries.splice(0,1),
    f=>f.branch.push(message('u2','user','Unanswered new request')),
    f=>f.event.context.contextEntries.at(-1).sourceEntry={...f.event.context.contextEntries.at(-1).sourceEntry,id:'not-persisted'},
  ]){
    const f=fixture();mutate(f);
    assert.equal(f.handler(f.event,f.ctx),undefined);
  }
});

test('custom messages are not real user requests and cannot replace the request identity',()=>{
  const f=fixture();
  const custom={type:'custom_message',id:'c1',customType:'context',content:'reminder',display:false};
  f.branch.splice(1,0,custom);
  f.event.context.contextEntries.splice(1,0,{sourceEntry:custom,messages:[{role:'custom',customType:'context',content:'reminder'}]});
  assert.equal(f.handler(f.event,f.ctx)?.entries.at(-1).details.requestEntryId,'u1');
  const noUser=fixture({branch:f.branch.filter(e=>e.id!=='u1')});
  assert.equal(noUser.handler(noUser.event,noUser.ctx),undefined);
});

test('compacted markers still count but a compacted-away request cannot be guessed',()=>{
  const f=fixture();persist(f,f.handler(f.event,f.ctx));
  f.branch.push({type:'compaction',id:'compact',firstKeptEntryId:'a1',summary:'Summary'});
  finalAnswer(f,'a2',bad);
  assert.equal(f.handler(f.event,f.ctx),undefined);
  const next=fixture({branch:f.branch,projected:f.event.context.contextEntries.filter(e=>e.sourceEntry.id!=='u1')});
  assert.equal(next.handler(next.event,next.ctx),undefined);
});

test('changing the active branch does not import a sibling branch attempt marker',()=>{
  const f=fixture();persist(f,f.handler(f.event,f.ctx));
  f.branch.splice(1); // Navigate to an alternative branch below the same user entry.
  const answer=message('alternative-answer','assistant',bad);
  f.branch.push(answer);
  f.event.context.contextEntries=f.branch.map(sourceEntry=>({sourceEntry,messages:[sourceEntry.message]}));
  f.event.context.contextMessages=f.branch.map(e=>e.message);
  assert.equal(f.handler(f.event,f.ctx)?.continue,true);
});

test('disabled handlers do not validate or notify',()=>{
  const f=fixture();
  const handler=api.createFeedbackHandler({enabled:()=>false,notify:()=>assert.fail('notice')});
  assert.equal(handler(f.event,f.ctx),undefined);
});
