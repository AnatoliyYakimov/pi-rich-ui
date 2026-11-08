import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from '../lib/parser.mjs';
import { chartData, chartStats, niceScale } from '../lib/charts.mjs';
import { renderDocument } from '../lib/render.mjs';
const plain=(xml,w=70,options={})=>renderDocument(xml,w,options).plain().join('\n');
test('nice limits include the complete data range',()=>{
 for(const [min,max]of [[12,63],[-13,44],[.0001,.00073],[-6,-1]]){const r=niceScale(min,max);assert.ok(r.min<=min);assert.ok(r.max>=max);}
 const i=chartData(parseDocument('<Chart values="12,63" nice/>'));assert.equal(i.min,0);assert.equal(i.max,80);
});
test('nice scaling never changes explicit min and max',()=>{const d=chartData(parseDocument('<Chart values="12,63" min={9} max={64} nice/>'));assert.equal(d.min,9);assert.equal(d.max,64);});
test('explicit irregular X coordinates change geometric spacing',()=>{
 const x='<Sparkline values="0,1,0" x="0,1,10" height={3}/>',uniform='<Sparkline values="0,1,0" height={3}/>';
 assert.notEqual(plain(x,50),plain(uniform,50));assert.deepEqual(chartData(parseDocument(x)).x,[0,1,10]);
});
test('X validates count, monotonicity, missing and invalid values',()=>{
 for(const x of ['0,1','0,0,1','2,1,0','0,null,2','0,1,NaN'])assert.throws(()=>plain(`<Chart values="1,2,3" x="${x}"/>`));
});
test('step interpolation differs from linear without creating data',()=>{
 const a=plain('<Chart values="0,10,0" interpolate="step"/>'),b=plain('<Chart values="0,10,0"/>');assert.notEqual(a,b);
 const d=chartData(parseDocument('<Chart><Series values="1,3,2" interpolate="step"/><Series values="3,2,1"/></Chart>'));assert.deepEqual(d.interpolate,['step','linear']);
});
test('rules are labeled and outside-range values are disclosed',()=>{
 for(const w of [15,70]){const s=plain('<Chart values="1,4,2"><Rule value={3} label="SLO"/><Rule value={99} label="Outside"/></Chart>',w);assert.match(s,/SLO = 3/);assert.match(s,/Outside = 99/);assert.match(s,/outside/);}
});
test('rules have numerical limits and do not silently change scale',()=>{
 const d=chartData(parseDocument('<Chart values="1,2,3"><Rule value={99}/></Chart>'));assert.equal(d.max,3);
 assert.throws(()=>plain('<Chart values="1,2"><Rule/></Chart>'));
 assert.throws(()=>plain('<Chart values="1,2">'+Array(5).fill('<Rule value={1}/>').join('')+'</Chart>'));
});
test('zero line can be disabled independently of range inclusion',()=>{
 const a=plain('<Chart values="-3,4,-2" zeroLine={false} grid={false}/>'),b=plain('<Chart values="-3,4,-2" zeroLine={true} grid={false}/>');assert.notEqual(a,b);
});
test('statistics use observed data, exclude gaps and preserve out-of-range values',()=>{
 assert.deepEqual(chartStats([3,null,-1,9,null]),{min:-1,max:9,last:9});assert.deepEqual(chartStats([null]),{min:null,max:null,last:null});
 const s=plain('<Chart values="-100,1,200" min={0} max={10} stats/>');assert.match(s,/min -100/);assert.match(s,/max 200/);assert.match(s,/last 200/);
});
test('monochrome stacked views keep identical X/domain and Rule legends',()=>{
 const s=plain('<Chart x="0,1,9" stats><Series label="A" values="1,2,3"/><Series label="B" values="3,2,1"/><Rule label="Target" value={2}/></Chart>',60,{monochrome:true});assert.equal((s.match(/Target = 2/g)||[]).length,2);assert.equal((s.match(/└/g)||[]).length,2);
});
test('subnormal finite values do not lead to unbounded raster loops',()=>{
 assert.doesNotThrow(()=>plain('<Chart values="0,5e-324" nice/>'));
});
