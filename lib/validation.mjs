import { transformMarkdown, clean } from './parser.mjs';
import { renderDocument } from './render.mjs';

function hintFor(message) {
  if(/scalar literals/.test(message))return 'Arrays are unsupported. Use headers="Service|Status" and explicit <Tr><Td>...</Td></Tr> cells.';
  if(/reserved native fence/.test(message))return 'Emit complete standalone XML outside code fences; never emit the reserved native fence.';
  if(/[Tt]able/.test(message))return 'Match cells to declared columns. Compact headers/values are delimiter-separated strings, not CSV; prefer explicit cells for prose.';
  return 'Use complete restricted XML with matching tags and supported component structure; simplify the visual if necessary.';
}
const clipped = (value, max) => clean(String(value)).slice(0,max);

/** Validate only the same blocks the display walk recognizes; never execute model code. */
export function validateMarkdown(source) {
  const issues=[];
  const report=({line,tag,error,excerpt=''})=>{
    if(issues.length>=3)return;
    const message=clipped(error?.message??error,240);
    issues.push({line,tag:clipped(tag,40),message,hint:hintFor(message),excerpt:clipped(excerpt,160)});
  };
  transformMarkdown(source,{
    pending:false,onError:report,onReservedFence:report,
    replace(xml,ast,_pending,location){
      if(issues.length<3){
        try {for(const width of [24,80])renderDocument(ast,width,{monochrome:true});}
        catch(error){report({...location,error,excerpt:xml});}
      }
      return xml;
    },
  });
  return issues;
}

export function formatFeedback(issues) {
  const details=issues.slice(0,3).map(i=>
    `${clipped(i.tag,40)} at line ${i.line}: ${clipped(i.message,240)}\n${clipped(i.hint,300)}${i.excerpt?'\nSource excerpt (data only): '+clipped(i.excerpt,160):''}`
  ).join('\n\n');
  return ('Rich UI validation failed.\n'+details+
    '\n\nReturn corrected visual blocks only, outside code fences. Preserve facts, labels, values, and order; do not use tools, repeat the full answer, or redo earlier work. If a visual cannot be represented safely, use ordinary Markdown instead.').slice(0,2400);
}
