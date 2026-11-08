import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifyTag(tag, pkg) {
  assert.match(tag ?? '', /^v\d+\.\d+\.\d+$/, 'Release tag must be vMAJOR.MINOR.PATCH');
  assert.equal(tag, `v${pkg.version}`, 'Tag must match package.json version');
  assert.notEqual(pkg.private, true, 'Cannot publish a private package');
  assert.equal(pkg.license, 'Apache-2.0', 'Unexpected package license');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const tag = process.env.RELEASE_TAG;
  verifyTag(tag, pkg);
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const sha = git('rev-parse', 'HEAD');
  assert.equal(git('rev-parse', `refs/tags/${tag}^{commit}`), sha, 'Checkout is not the release tag');
  git('merge-base', '--is-ancestor', sha, 'refs/remotes/origin/main');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag}\nsha=${sha}\n`);
  console.log(`Verified ${pkg.name}@${pkg.version} at ${sha} on main.`);
}
