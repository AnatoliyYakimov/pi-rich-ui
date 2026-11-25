import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDocument } from '../lib/render.mjs';
const draw = (xml, w = 80, options = {}) => renderDocument(xml, w, { presentation: false, ...options });
const lines = (xml, w, options) => draw(xml, w, options).plain();
const rule = /^─+(?:┼─+)*$/;

const findings = `<Table headers="Находка|Файл|Что создаётся">
<Tr><Td>file + line</Td><Td>есть в диффе MR</Td><Td>inline-тред на строке, неизменённые строки тоже можно</Td></Tr>
<Tr><Td>file, line = null</Td><Td>есть в диффе MR</Td><Td>тред на файл (position_type file)</Td></Tr>
<Tr><Td>file ± line</Td><Td>вне MR, но есть на head</Td><Td>обсуждение MR, первая строка ведёт ссылкой на blob (с #L, если указана строка)</Td></Tr>
<Tr><Td>file = null, line = null</Td><Td>—</Td><Td>обсуждение MR без ссылки</Td></Tr>
</Table>`;

test('table separates columns and every row by default', () => {
  const out = lines('<Table headers="Name|State"><Tr><Td>API</Td><Td>healthy</Td></Tr><Tr><Td>Orders</Td><Td>degraded</Td></Tr></Table>', 50);
  assert.deepEqual(out.map(l => rule.test(l)), [false, true, false, true, false], out.join('\n'));
  assert.ok(out[1].includes('┼') && out[3].includes('┼'), out.join('\n'));
  for (const y of [0, 2, 4]) assert.ok(out[y].includes('│'), out[y]);
  assert.equal(out[0].indexOf('│'), out[1].indexOf('┼'));
});

test('row separators also split wrapped rows', () => {
  const out = lines(findings, 96);
  assert.equal(out.filter(l => rule.test(l)).length, 4, out.join('\n'));
});

test('separators and column separators can be turned off', () => {
  const out = lines('<Table headers="Name|State" separators={false} columnSeparators={false}><Tr values="API|healthy"/><Tr values="Orders|degraded"/></Table>', 50);
  assert.equal(out.length, 4, out.join('\n'));
  assert.ok(!out.join('\n').match(/[│┼]/), out.join('\n'));
  assert.match(out[1], /^─+$/);
});

test('short columns keep their natural width while a long column wraps', () => {
  const out = lines(findings, 96), text = out.join('\n');
  for (const cell of ['file = null, line = null', 'file, line = null', 'вне MR, но есть на head']) assert.ok(text.includes(cell), `${cell}\n${text}`);
  assert.ok(out.length > 4 + 4 + 1, text);
});

test('vertical timeline rail runs through the step markers', () => {
  const xml = '<Timeline direction="TB"><Step label="A" status="done" detail="first"/><Step label="B" status="blocked" detail="second"/><Step label="C" status="pending" detail="third"/></Timeline>';
  const surface = draw(xml, 50, { monochrome: true }), out = surface.plain();
  const marks = out.map((l, y) => [l[0], y]).filter(([g]) => '✓!○'.includes(g));
  assert.deepEqual(marks.map(([g]) => g), ['✓', '!', '○'], out.join('\n'));
  assert.deepEqual(['✓ A', '! B', '○ C'], marks.map(([, y]) => out[y]));
  for (let y = marks[0][1] + 1; y < marks[2][1]; y++) if (!marks.some(([, m]) => m === y)) assert.equal(out[y][0], '│', out.join('\n'));
  assert.ok(!out.slice(marks[2][1] + 1).some(l => l.startsWith('│')), out.join('\n'));
  assert.ok(!/\[(done|blocked|pending)\]|\d\. /.test(out.join('\n')), out.join('\n'));
  assert.equal(surface.rows[marks[0][1] + 1][0].role, 'success');
});

test('horizontal timeline draws one connected track with labels under markers', () => {
  const xml = '<Timeline><Step label="Prepare" status="done" detail="Schema and outbox table"/><Step label="Shadow" status="active" detail="Compare deliveries without side effects"/><Step label="Cut over" status="pending"/></Timeline>';
  const out = lines(xml, 100);
  assert.match(out[0], /^✓ ─+ ▶ ─+ ○$/, out.join('\n'));
  for (const [mark, name] of [['✓', 'Prepare'], ['▶', 'Shadow'], ['○', 'Cut over']]) assert.equal(out[1].indexOf(name), out[0].indexOf(mark), out.join('\n'));
  assert.ok(out.join('\n').includes('Schema and outbox table'));
});

test('timeline step without status keeps a neutral marker', () => {
  const out = lines('<Timeline direction="TB"><Step label="A"/><Step label="B"/></Timeline>', 40);
  assert.equal(out[0], '● A');
  assert.equal(out.at(-1), '● B');
});
