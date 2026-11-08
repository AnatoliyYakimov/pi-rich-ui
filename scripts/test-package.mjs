/** Exercise the distributable, including runtime files invisible to source-only tests. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'pi-rich-ui-package-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
try {
  const [pack] = JSON.parse(execFileSync(npm, [
    'pack', '--json', '--ignore-scripts', '--pack-destination', temp,
    '--cache', join(temp, 'cache'),
  ], { cwd: root, encoding: 'utf8' }));
  const paths = new Set(pack.files.map(f => f.path));
  const required = ['index.ts', 'package.json', 'LICENSE', 'NOTICE', 'README.md', 'CHANGELOG.md',
    'docs/REFERENCE.md', 'docs/GALLERY.md', 'docs/INTEGRATION.md', 'docs/RELEASING.md'];
  for (const dir of ['lib', 'examples']) {
    for (const name of readdirSync(join(root, dir))) required.push(`${dir}/${name}`);
  }
  for (const path of required) assert.ok(paths.has(path), `Missing runtime/documentation file: ${path}`);
  for (const path of paths) {
    assert.ok(!/(^|\/)(?:node_modules|tests|scripts|\.github|\.git|\.npm-cache)(\/|$)/.test(path), `Development file shipped: ${path}`);
    assert.ok(!/(^|\/)\.[^/]+/.test(path), `Hidden file shipped: ${path}`);
  }
  execFileSync('tar', ['-xzf', join(temp, pack.filename), '-C', temp]);
  const installed = join(temp, 'package');
  const pkg = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  assert.notEqual(pkg.private, true);
  assert.equal(pkg.license, 'Apache-2.0');
  assert.deepEqual(pkg.pi.extensions, ['./index.ts']);
  assert.ok(!pkg.dependencies, 'Pi host modules must not be bundled as runtime dependencies');
  for (const host of ['@earendil-works/pi-coding-agent', '@earendil-works/pi-tui']) {
    assert.equal(pkg.peerDependencies[host], '*');
  }
  const { REFERENCE_PATH, SYSTEM_GUIDE } = await import(pathToFileURL(join(installed, 'lib/prompt.mjs')));
  assert.equal(realpathSync(REFERENCE_PATH), realpathSync(join(installed, 'docs/REFERENCE.md')));
  assert.match(readFileSync(REFERENCE_PATH, 'utf8'), /titlePosition/);
  const { setup } = await import(pathToFileURL(join(installed, 'lib/extension.mjs')));
  const hooks = new Map(), commands = new Map(), entries = [], renderers = new Map();
  const pi = {
    on: (name, fn) => hooks.set(name, fn), registerMarkdownTransformer() {},
    registerCommand: (name, command) => commands.set(name, command),
    registerEntryRenderer: (name, renderer) => renderers.set(name, renderer),
    appendEntry: (type, data) => entries.push({ type, data }),
  };
  const tui = process.env.PI_TUI_MODULE ? await import(pathToFileURL(resolve(process.env.PI_TUI_MODULE))) : {};
  await setup(pi, tui, { env: {} });
  const context = { mode: 'tui', hasUI: true, ui: { theme: {}, notify() {} } };
  for (const name of ['demo', 'layers', 'boundaries', 'workflow', 'decisions', 'compare', 'architecture', 'components', 'titles', 'dashboard',
    'table', 'diff', 'sequence', 'tree', 'timeline', 'layout', 'charts', 'palette']) {
    await commands.get('rich-ui').handler(name, context);
    const entry = entries.at(-1);
    const view = renderers.get(entry.type)(entry, {}, context.ui.theme);
    for (const width of [24, 40, 80, 120]) assert.ok(view.render(width).length > 0, name);
  }
  hooks.get('session_shutdown')();
  if (process.env.PI_AGENT_MODULE) {
    const { loadExtensions } = await import(pathToFileURL(resolve(process.env.PI_AGENT_MODULE)));
    const loaded = await loadExtensions([join(installed, 'index.ts')], installed);
    assert.deepEqual(loaded.errors, [], 'Pi could not load the published entry point');
    assert.equal(loaded.extensions.length, 1);
    const extension = loaded.extensions[0];
    assert.ok(extension.commands.has('rich-ui'));
    assert.equal(typeof extension.markdownTransformer, 'function');
    const agentModule = pathToFileURL(resolve(process.env.PI_AGENT_MODULE));
    const { ExtensionRunner } = await import(new URL('./runner.js', agentModule));
    const { buildSystemPrompt } = await import(new URL('../system-prompt.js', agentModule));
    // Match pi-memory's legacy return before/after our structured prompt handler.
    const memory = {
      path: 'memory-fixture',
      handlers: new Map([['before_agent_start', [event => ({
        systemPrompt: event.systemPrompt + '\n\n## Memory\nTest snapshot',
      })]]]),
    };
    for (const [name, extensions, forced] of [
      ['Rich UI alone', [extension], false],
      ['Memory before Rich UI', [memory, extension], true],
      ['Memory after Rich UI', [extension, memory], true],
    ]) {
      const runner = new ExtensionRunner(extensions, loaded.runtime, installed);
      runner.setUIContext(context.ui, 'tui');
      const errors = [];
      runner.onError(error => errors.push(error));
      let options = { cwd: installed };
      for (let turn = 0; turn < 2; turn++) {
        const result = await runner.emitBeforeAgentStart({ messageType: 'user', prompt: 'Compare options' }, options);
        assert.deepEqual(errors, [], `${name}: prompt hook failed`);
        options = result.systemPromptOptions;
        const prompt = buildSystemPrompt(options);
        assert.equal(prompt.split(SYSTEM_GUIDE).length - 1, 1, `${name}: guidance missing or duplicated`);
        assert.equal(options.forceSystemPrompt !== undefined, forced, `${name}: changed prompt mode`);
        if (forced) assert.ok(prompt.includes('## Memory\nTest snapshot'), `${name}: earlier instructions lost`);
      }
    }
    for (const handler of extension.handlers.get('session_shutdown') ?? []) await handler({}, context);
    console.log('PASS: packed index.ts loads through Pi; model guidance survives legacy prompt handlers in either order.');
    const { testFeedbackHost } = await import('./test-feedback-host.mjs');
    await testFeedbackHost({ installed, agentModule });
  }
  console.log(`PASS: npm archive (${paths.size} files), Apache license, reference and all 18 demos.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
