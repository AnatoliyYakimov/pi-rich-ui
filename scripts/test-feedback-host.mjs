/** Offline lifecycle regressions using the real Pi session and packed extension. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const bad='<Table headers={["Service","Status"]}><Tr values={["API","OK"]}/></Table>';
const good='<Table headers="Service|Status"><Tr><Td>API</Td><Td>OK</Td></Tr></Table>';
const model={id:'rich-ui-offline',name:'Offline regression',api:'openai-completions',provider:'openai',baseUrl:'http://offline.invalid',reasoning:false,input:['text'],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:1000000,maxTokens:4096};
const usage={input:1,output:1,cacheRead:0,cacheWrite:0,totalTokens:2,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}};
const textOf=m=>typeof m.content==='string'?m.content:(m.content??[]).filter(c=>c.type==='text').map(c=>c.text).join('\n');

export async function testFeedbackHost({installed,agentModule}) {
  const loaderURL=agentModule instanceof URL?agentModule:pathToFileURL(resolve(agentModule));
  const {loadExtensions}=await import(loaderURL);
  const {createAgentSession}=await import(new URL('../sdk.js',loaderURL));
  const {SessionManager}=await import(new URL('../session-manager.js',loaderURL));
  const {SettingsManager}=await import(new URL('../settings-manager.js',loaderURL));
  const {ModelRuntime}=await import(new URL('../model-runtime.js',loaderURL));
  const root=mkdtempSync(join(tmpdir(),'pi-rich-ui-feedback-'));
  const handles=[];
  let serial=0;
  async function open(outputs,{before,after,customTools=[],manager,onRequest}={}) {
    const dir=join(root,String(++serial));
    const loaded=await loadExtensions([join(installed,'index.ts')],installed);
    assert.deepEqual(loaded.errors,[]);
    const extension=loaded.extensions[0];
    const other=(name,handler)=>({...extension,path:name,handlers:new Map([['agent_before_settle',[handler]]]),tools:new Map(),commands:new Map(),shortcuts:new Map(),flags:new Map(),messageRenderers:new Map(),markdownTransformer:undefined});
    loaded.extensions=[...(before?[other('before-fixture',before)]:[]),extension,...(after?[other('after-fixture',after)]:[])];
    const resourceLoader={
      getExtensions:()=>loaded,getSkills:()=>({skills:[],diagnostics:[]}),getPrompts:()=>({prompts:[],diagnostics:[]}),
      getThemes:()=>({themes:[],diagnostics:[]}),getAgentsFiles:()=>({agentsFiles:[]}),getSystemPrompt:()=> 'Offline Rich UI regression.',
      getSystemPromptSource:()=>undefined,getAppendSystemPrompt:()=>[],getAppendSystemPromptSources:()=>[],extendResources(){},async reload(){},
    };
    const modelRuntime=await ModelRuntime.create({authPath:join(dir,'auth.json'),modelsPath:join(dir,'models.json')});
    await modelRuntime.setRuntimeApiKey(model.provider,'offline-test-key');
    const sessionManager=manager??SessionManager.inMemory(dir);
    const {session}=await createAgentSession({cwd:dir,agentDir:dir,model,thinkingLevel:'off',modelRuntime,resourceLoader,
      sessionManager,settingsManager:SettingsManager.inMemory({compaction:{enabled:false},retry:{enabled:false},cacheWarming:'off'}),
      tools:customTools.map(t=>t.name),customTools,
    });
    const requests=[],notices=[],errors=[];
    session.agent.streamFunction=async (_model,context)=>{
      requests.push(structuredClone(context));
      assert.ok(requests.length<=10,'Unbounded correction loop');
      await onRequest?.(requests.length,session);
      const output=outputs.shift();
      assert.notEqual(output,undefined,'Unexpected provider request');
      const data=typeof output==='string'?{content:[{type:'text',text:output}]}:output;
      const message={role:'assistant',api:model.api,provider:model.provider,model:model.id,usage:structuredClone(usage),stopReason:'stop',timestamp:Date.now(),...data};
      return {async *[Symbol.asyncIterator](){yield {type:['error','aborted'].includes(message.stopReason)?'error':'done',reason:message.stopReason,message};},result:async()=>message};
    };
    await session.bindExtensions({mode:'tui',uiContext:{notify:(message,severity)=>notices.push({message,severity})},onError:e=>errors.push(e)});
    const h={session,manager:sessionManager,requests,notices,errors,async close(){
      await session.extensionRunner?.emit({type:'session_shutdown',reason:'quit'});
      session.dispose();
    }};
    handles.push(h);
    return h;
  }
  const diagnostics=h=>h.manager.getBranch().filter(e=>e.type==='custom_message'&&e.customType==='pi-rich-ui-validation');
  const assertClean=h=>assert.deepEqual(h.errors,[],'Host extension errors');
  try {
    const valid=await open([good]);
    await valid.session.prompt('Show service status');
    assert.equal(valid.requests.length,1);
    assert.equal(diagnostics(valid).length,0);
    assertClean(valid);

    const repair=await open([bad,good,bad,good]);
    await repair.session.prompt('Show service status');
    assert.equal(repair.requests.length,2,'Invalid final markup must request one correction');
    assert.equal(diagnostics(repair).length,1);
    assert.ok(repair.requests[1].messages.some(m=>m.role==='user'&&/Rich UI validation failed/.test(textOf(m))),'Provider did not receive the diagnostic');
    assert.ok(repair.manager.getBranch().some(e=>e.type==='message'&&e.message.role==='assistant'&&textOf(e.message)===bad),'Original answer was rewritten');
    assert.equal(repair.session.getLastAssistantText(),good);
    await repair.session.prompt('Show service status');
    assert.equal(repair.requests.length,4,'A new real request needs its own attempt budget');
    assert.notEqual(diagnostics(repair)[0].details.requestEntryId,diagnostics(repair)[1].details.requestEntryId);
    assertClean(repair);

    const invalid=await open([bad,bad]);
    await invalid.session.prompt('Show service status');
    assert.equal(invalid.requests.length,2);
    assert.equal(diagnostics(invalid).length,1);
    assert.ok(invalid.notices.some(n=>/automatic correction stopped/.test(n.message)));
    assertClean(invalid);

    let calls=0;
    const tools=await open([{content:[{type:'text',text:bad},{type:'toolCall',id:'once-1',name:'observe_once',arguments:{}}],stopReason:'toolUse'},bad,good],{
      customTools:[{name:'observe_once',label:'Observe once',description:'Offline observation',parameters:{type:'object',properties:{},required:[]},execute:async()=>{calls++;return {content:[{type:'text',text:'Observed'}],details:{}};}}],
    });
    await tools.session.prompt('Observe once, then show status');
    assert.equal(tools.requests.length,3);
    assert.equal(calls,1,'Correction repeated a completed tool call');
    assert.equal(diagnostics(tools).length,1);
    assertClean(tools);

    let queued=false;
    const follow=await open([bad,bad,good],{onRequest:async(index,session)=>{
      if(index===1&&!queued){queued=true;assert.equal(await session.followUp('Now show the updated status'),'queued');}
    }});
    await follow.session.prompt('Show initial status');
    assert.equal(follow.requests.length,3);
    const lastUser=follow.manager.getBranch().findLast(e=>e.type==='message'&&e.message.role==='user');
    assert.equal(diagnostics(follow).length,1);
    assert.equal(diagnostics(follow)[0].details.requestEntryId,lastUser.id,'Feedback was attributed to a stale request');
    assertClean(follow);

    for(const stopReason of ['error','aborted']){
      const failed=await open([{content:[{type:'text',text:bad}],stopReason,errorMessage:'Offline final error'}]);
      await failed.session.prompt('Show status');
      assert.equal(failed.requests.length,1);
      assert.equal(diagnostics(failed).length,0);
      assertClean(failed);
    }

    // Another extension's state-only proposal must survive our appended diagnostic.
    let proposed=false;
    const composed=await open([bad,good],{before:event=>{
      if(proposed)return;proposed=true;
      return {entries:[...event.entries,{type:'custom',customType:'other-state',data:{kept:true}}]};
    }});
    await composed.session.prompt('Show status');
    assert.equal(composed.requests.length,2);
    assert.ok(composed.manager.getBranch().some(e=>e.type==='custom'&&e.customType==='other-state'&&e.data.kept));
    assertClean(composed);

    let continued=false;
    const deferred=await open([bad,bad,good],{before:event=>{
      if(continued)return;continued=true;
      return {entries:[...event.entries,{type:'custom_message',customType:'other-work',content:'Finish pending work first.',display:false}],continue:true};
    }});
    await deferred.session.prompt('Show status');
    assert.equal(deferred.requests.length,3);
    assert.ok(!deferred.requests[1].messages.some(m=>/Rich UI validation failed/.test(textOf(m))));
    assert.ok(deferred.requests[2].messages.some(m=>/Rich UI validation failed/.test(textOf(m))));
    assertClean(deferred);

    // Later suppression persists our diagnostic without generating a correction response.
    const suppressed=await open([bad],{after:()=>({continue:false})});
    await suppressed.session.prompt('Show status');
    assert.equal(suppressed.requests.length,1);
    assert.equal(diagnostics(suppressed).length,1);
    const restoredManager=SessionManager.inMemory(root,undefined,[suppressed.manager.getHeader(),...suppressed.manager.getBranch()]);
    await suppressed.close();handles.splice(handles.indexOf(suppressed),1);
    const restored=await open([bad],{manager:restoredManager});
    // A custom-started background run must not reset the prior real user's budget.
    await restored.session.sendCustomMessage({customType:'background-fixture',content:'Continue without a new user request.',display:false},{triggerTurn:true});
    await restored.session.waitForIdle();
    assert.equal(restored.requests.length,1);
    assert.equal(diagnostics(restored).length,1);
    assertClean(restored);
    // Exercise a fresh real runner against the restored active projection with a
    // user-originated eligibility signal, but without creating a new user entry.
    await restored.session.extensionRunner.emitBeforeAgentStart({messageType:'user',prompt:'Restored boundary fixture'},{cwd:root});
    const replay=await restored.session.extensionRunner.emitBoundary({type:'agent_before_settle',outcome:'completed'},()=>{
      const projection=restored.manager.buildSessionProjection();
      return {contextEntries:projection.entries,contextMessages:projection.messages,llmMessages:[],pendingMessages:[],canContinue:false};
    });
    assert.equal(replay.continue,false,'Restored attempt marker was ignored');
    assert.equal(replay.entries.length,0);
    assertClean(restored);
    console.log('PASS: packed Pi lifecycle — valid/invalid answers, one-attempt repair, provider-visible feedback, independent requests, tools, queued follow-up, errors/abort, boundary composition, suppression and restored context.');
  } finally {
    for(const h of handles.toReversed())await h.close();
    rmSync(root,{recursive:true,force:true});
  }
}
