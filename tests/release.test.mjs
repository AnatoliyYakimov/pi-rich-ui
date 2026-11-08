import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTag } from '../scripts/verify-release.mjs';
import { verifyExistingArchive } from '../scripts/publish.mjs';

const pkg = { version: '0.5.2', license: 'Apache-2.0' };
test('release accepts only a stable tag matching the package version', () => {
  assert.doesNotThrow(() => verifyTag('v0.5.2', pkg));
  for (const tag of [undefined, '', 'main', '0.5.2', 'v0.5.1', 'v0.5.2-beta.1', 'v0.5.2\nsha=evil']) {
    assert.throws(() => verifyTag(tag, pkg));
  }
});
test('release rejects accidental private or unlicensed packages', () => {
  assert.throws(() => verifyTag('v0.5.2', { ...pkg, private: true }));
  assert.throws(() => verifyTag('v0.5.2', { ...pkg, license: undefined }));
});
test('publication retries only accept byte-identical existing archives', () => {
  assert.doesNotThrow(() => verifyExistingArchive({ dist: { integrity: 'sha512-same' } }, 'sha512-same'));
  assert.throws(() => verifyExistingArchive({ dist: { integrity: 'sha512-different' } }, 'sha512-same'));
  assert.throws(() => verifyExistingArchive({}, 'sha512-same'));
});
