/** Publish exactly the tested archive; safely resume if npm succeeded on an earlier run. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export function verifyExistingArchive(metadata, integrity) {
  assert.equal(metadata.dist?.integrity, integrity,
    'This version already exists in npm with different contents. Bump the version; never replace a release.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use npm publish locally for the first release. This script requires GitHub OIDC.');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const temp = mkdtempSync(join(tmpdir(), 'pi-rich-ui-publish-'));
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const run = args => execFileSync(npm, args, { cwd: root, encoding: 'utf8' });
    const npmVersion = run(['--version']).trim().split('.').map(Number);
    assert.ok(npmVersion[0] > 11 || (npmVersion[0] === 11 && npmVersion[1] >= 5), 'npm >=11.5.1 is required for OIDC');
    if (npmVersion[0] === 11 && npmVersion[1] === 5) assert.ok(npmVersion[2] >= 1, 'npm >=11.5.1 is required for OIDC');
    const [pack] = JSON.parse(run(['pack', '--json', '--ignore-scripts', '--pack-destination', temp]));
    const archive = join(temp, pack.filename);
    const integrity = 'sha512-' + createHash('sha512').update(readFileSync(archive)).digest('base64');
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${pkg.version}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) {
      verifyExistingArchive(await response.json(), integrity);
      console.log(`${pkg.name}@${pkg.version} is already published with identical contents; continuing to GitHub Release.`);
    } else {
      assert.equal(response.status, 404, `Cannot check npm registry: HTTP ${response.status}`);
      execFileSync(npm, ['publish', archive, '--registry', 'https://registry.npmjs.org/',
        '--access', 'public', '--tag', 'latest', '--provenance', '--ignore-scripts'], { cwd: root, stdio: 'inherit' });
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
