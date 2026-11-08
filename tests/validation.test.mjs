import test from 'node:test';
import assert from 'node:assert/strict';
import { transformMarkdown, LANGUAGE, LIMITS } from '../lib/parser.mjs';

// The parser's real walk must report failures without changing display behavior.
test('parser reports invalid arrays with their original root and line',()=>{
  const source='Before\n<Table headers={["Service","Status"]}><Tr values="API,OK"/></Table>\nAfter';
  const issues=[];
  assert.equal(transformMarkdown(source,{onError:i=>issues.push(i)}),source);
  assert.equal(issues.length,1);
  assert.equal(issues[0].line,2);
  assert.equal(issues[0].tag,'Table');
  assert.match(issues[0].error.message,/Only scalar literals/);
});

test('parser reports one malformed root and never its valid descendants',()=>{
  for(const source of ['<Box>\n<Metric value={8}/>','<Box>\n<Metric value={8}/>\n</Row>']){
    const issues=[];
    assert.equal(transformMarkdown(source,{onError:i=>issues.push(i)}),source);
    assert.equal(issues.length,1);
    assert.equal(issues[0].tag,'Box');
    assert.match(issues[0].error.message,/Unclosed|Mismatched/);
  }
});

test('only top-level reserved fences are reported',()=>{
  const issues=[];
  const source='````xml\n```'+LANGUAGE+'\n<Diff/>\n```\n````\n```'+LANGUAGE+'\n<Diff/>\n```';
  assert.equal(transformMarkdown(source,{onReservedFence:i=>issues.push(i)}),source);
  assert.equal(issues.length,1);
  assert.equal(issues[0].line,6);
});

test('diagnostic callbacks do not run for streaming partial blocks or literal examples',()=>{
  const issues=[];
  for(const source of ['    <Box>','Use `<Box>`','<Unknown/>','<Box/> prose','```xml\n<Box>\n```','~~~~\n<Box>\n~~~~']){
    assert.equal(transformMarkdown(source,{onError:i=>issues.push(i)}),source);
  }
  transformMarkdown('<Box>',{isStreaming:true,onError:i=>issues.push(i)});
  assert.deepEqual(issues,[]);
});

// Dynamic import lets the missing feature fail as an assertion during RED.
const api=await import('../lib/validation.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('validation and feedback API is available',()=>{
  assert.equal(typeof api.validateMarkdown,'function');
  assert.equal(typeof api.formatFeedback,'function');
});

const validate=s=>{assert.equal(typeof api.validateMarkdown,'function');return api.validateMarkdown(s);};
test('valid explicit cells preserve delimiters and supported missing cells',()=>{
  assert.deepEqual(validate('<Table headers="Service|Status"><Tr><Td>API | Gateway</Td><Td>Healthy, no errors</Td></Tr><Tr><Td>DB</Td></Tr></Table>'),[]);
});

test('validation catches renderer semantics after parsing succeeds',()=>{
  for(const [source,want] of [
    ['<Table headers="A|B"><Tr values="one,two,three"/></Table>',/more cells/],
    ['<Graph><Node id="a"/><Edge from="a" to="missing"/></Graph>',/Unknown graph endpoint/],
    ['<Box><Unknown/></Box>',/Unknown tag/],
  ]){
    const issues=validate(source);
    assert.equal(issues.length,1);
    assert.match(issues[0].message,want);
    assert.equal(issues[0].line,1);
  }
});

test('validation ignores ordinary literal examples including nested reserved fences',()=>{
  for(const source of ['Normal prose','```jsx\n<Table headers={["A"]}/>\n```','    <Table headers={["A"]}/>','`<Box>`','<Unknown/>','<Text>ok</Text> prose','````\n```'+LANGUAGE+'\n<Diff/>\n```\n````'])assert.deepEqual(validate(source),[]);
});

test('feedback is bounded, sanitized, and instructs content-preserving correction',()=>{
  const source=Array.from({length:10},()=>'<Table headers={["'+ 'x'.repeat(200)+'\x1b[31m"]}/>').join('\n');
  const issues=validate(source);
  assert.equal(issues.length,3);
  assert.ok(issues.every(i=>i.excerpt.length<=160));
  const feedback=api.formatFeedback(issues);
  assert.ok(feedback.length<=2400);
  assert.doesNotMatch(feedback,/\x1b/);
  assert.match(feedback,/Arrays are unsupported/);
  assert.match(feedback,/do not use tools/i);
  assert.match(feedback,/Preserve/i);
  assert.match(feedback,/ordinary Markdown/);
});

test('reserved fences receive protocol feedback even with valid markup',()=>{
  const issues=validate('```'+LANGUAGE+'\n<Diff before="old" after="new"/>\n```');
  assert.equal(issues.length,1);
  assert.match(issues[0].message,/reserved.*fence/i);
  assert.match(issues[0].hint,/outside/i);
});

test('validation bounds message, block, node, and scan sizes',()=>{
  assert.deepEqual(validate('x'.repeat(LIMITS.message+1)),[]);
  assert.equal(validate('<Box>'+ '<Text>x</Text>'.repeat(301)+'</Box>').length,1);
  assert.equal(validate('<Box>'+ 'x'.repeat(LIMITS.source)+'</Box>').length,1);
  assert.equal(validate('<Box>'.repeat(22)+'</Box>'.repeat(22)).length,1);
  const issues=validate('<Text>ok</Text>\n'.repeat(64)+'<Box>');
  assert.equal(issues.length,1);
  assert.match(issues[0].message,/64/);
});
