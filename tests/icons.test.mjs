import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES, NERD_ICONS, UNICODE_ICONS, detectIconSet, setIconSet, icon } from '../lib/icons.mjs';
import { widthOf } from '../lib/surface.mjs';
import { renderDocument } from '../lib/render.mjs';

test('every short icon name has a one-cell Nerd glyph and a one-cell Unicode fallback', () => {
  for (const name of ICON_NAMES) {
    assert.ok(name.length <= 7, name);
    for (const set of [NERD_ICONS, UNICODE_ICONS]) assert.equal(widthOf(set[name]), 1, name);
  }
});

test('Nerd icons come from Material Design so they share one style', () => {
  for (const name of ICON_NAMES) {
    const cp = NERD_ICONS[name].codePointAt(0);
    assert.ok(cp >= 0xF0001 && cp <= 0xF1AF0 || NERD_ICONS[name] === UNICODE_ICONS[name], name);
  }
});

test('icon set follows the explicit setting, then the powerline setting, then the terminal', () => {
  assert.equal(detectIconSet({}), 'unicode');
  assert.equal(detectIconSet({ TERM_PROGRAM: 'ghostty' }), 'nerd');
  assert.equal(detectIconSet({ GHOSTTY_RESOURCES_DIR: '/x', TERM_PROGRAM: 'tmux' }), 'nerd');
  assert.equal(detectIconSet({ TERM: 'xterm-kitty' }), 'nerd');
  assert.equal(detectIconSet({ TERM_PROGRAM: 'Apple_Terminal' }), 'unicode');
  assert.equal(detectIconSet({ TERM_PROGRAM: 'ghostty', POWERLINE_NERD_FONTS: '0' }), 'unicode');
  assert.equal(detectIconSet({ POWERLINE_NERD_FONTS: '1' }), 'nerd');
  assert.equal(detectIconSet({ POWERLINE_NERD_FONTS: '1', PI_RICH_UI_ICONS: 'unicode' }), 'unicode');
  assert.equal(detectIconSet({ PI_RICH_UI_ICONS: 'nerd' }), 'nerd');
});

test('switching the set changes rendered icons while long legacy names keep working', () => {
  try {
    assert.equal(setIconSet('nerd'), 'nerd');
    assert.equal(icon('db'), NERD_ICONS.db);
    assert.equal(icon('Database'), NERD_ICONS.db);
    assert.equal(icon('arrow-right'), '→');
    assert.match(renderDocument('<Card icon="k8s" title="Cluster"><Text>X</Text></Card>', 30).plain().join('\n'), new RegExp(NERD_ICONS.k8s));
    assert.equal(setIconSet('anything'), 'unicode');
    assert.equal(icon('db'), '▤');
    assert.equal(icon('settings'), '⚙');
    assert.equal(icon('unknown'), '•');
  } finally {
    setIconSet('unicode');
  }
});
