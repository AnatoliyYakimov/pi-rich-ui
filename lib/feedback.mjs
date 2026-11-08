import { validateMarkdown, formatFeedback } from './validation.mjs';

const TYPE='pi-rich-ui-validation';

/** Final-boundary feedback only. The persisted diagnostic is also the attempt marker. */
export function createFeedbackHandler({enabled,notify=()=>{}}) {
  const attempts=new Map();
  const notice=(ctx,text,severity)=>{try{notify(ctx,text,severity);}catch{/* UI is optional. */}};
  return (event,ctx)=>{
    try {
      if(!enabled(ctx)||event.outcome!=='completed'||event.continue||!Array.isArray(event.entries))return;
      const preview=event.context;
      if(!Array.isArray(preview?.pendingMessages)||preview.pendingMessages.length||
        !Array.isArray(preview.contextEntries)||!Array.isArray(preview.contextMessages))return;
      const answer=preview.contextMessages.at(-1);
      if(answer?.role!=='assistant'||answer.stopReason!=='stop'||!Array.isArray(answer.content)||
        answer.content.some(c=>c.type==='toolCall'))return;
      const text=answer.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      if(!text.trim())return;
      const projected=preview.contextEntries;
      const assistant=projected.findLast(e=>e.messages?.includes(answer))?.sourceEntry;
      const user=projected.findLast(e=>e.sourceEntry?.type==='message'&&e.sourceEntry.message?.role==='user'&&
        e.messages?.some(m=>m.role==='user'))?.sourceEntry;
      if(assistant?.type!=='message'||assistant.message?.role!=='assistant'||!assistant.id||!user?.id)return;
      const manager=ctx.sessionManager,branch=manager?.getBranch(),sessionId=manager?.getSessionId();
      if(!Array.isArray(branch)||!sessionId)return;
      const rawAssistant=branch.find(e=>e.id===assistant.id);
      const latestUser=branch.findLast(e=>e.type==='message'&&e.message?.role==='user');
      if(rawAssistant?.type!=='message'||rawAssistant.message?.role!=='assistant'||latestUser?.id!==user.id)return;
      // Edits may change which request/answer is being corrected; do not guess attribution.
      if([...branch,...event.entries].some(e=>e.type==='context_edit'&&[user.id,assistant.id].includes(e.targetId)))return;
      const issues=validateMarkdown(text);
      if(!issues.length)return;
      const key=sessionId+':'+user.id+':'+assistant.id;
      const marker=branch.find(e=>e.type==='custom_message'&&e.customType===TYPE&&
        e.details?.version===1&&e.details.requestEntryId===user.id);
      const spent=attempts.get(key)??(marker?{assistantEntryId:marker.details.assistantEntryId,warned:false}:undefined);
      if(spent){
        if(spent.assistantEntryId!==assistant.id&&!spent.warned){
          spent.warned=true;
          notice(ctx,'Rich UI correction is still invalid; automatic correction stopped.','warning');
        }
        attempts.set(key,spent);
        if(attempts.size>256)attempts.delete(attempts.keys().next().value);
        return;
      }
      attempts.set(key,{assistantEntryId:assistant.id,warned:false});
      if(attempts.size>256)attempts.delete(attempts.keys().next().value);
      notice(ctx,'Rich UI detected invalid markup; requesting one correction.','info');
      return {
        entries:[...event.entries,{
          type:'custom_message',customType:TYPE,display:false,content:formatFeedback(issues),
          details:{version:1,requestEntryId:user.id,assistantEntryId:assistant.id},
        }],
        continue:true,
      };
    } catch {
      // Unsupported host shapes or unavailable session provenance must not break the run.
      return;
    }
  };
}
