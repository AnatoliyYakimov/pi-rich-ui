# Releases

Package: `pi-rich-ui-inline` on `https://registry.npmjs.org/`.
Repository: `AnatoliyYakimov/pi-rich-ui`. License: Apache-2.0.

## What runs automatically

- Pushes to `main` and pull requests: syntax, unit/snapshot tests and npm archive
  checks on Node 22.19.0, 24 and 26; real Pi 1.5.0 renderer and extension-loader tests.
- Tags `vMAJOR.MINOR.PATCH`: verify the tag matches `package.json` and belongs to
  `main`, run CI, then create a GitHub Release with generated notes. npm publication
  is skipped; no npm account or package is required for a GitHub release.
- Manual **Actions → Publish → Run workflow** accepts an existing tag for retries.
  Select that same tag in **Use workflow from** and in the `tag` input. Leave
  `publish_npm` unchecked for a GitHub-only release. Enable it only after the npm
  bootstrap below; the workflow then also publishes to npm before creating the
  GitHub Release. The workflow must run at the release commit so checks and any
  npm provenance identify the exact released source.

The project has no dependencies to install for the unit suite. Pi's host packages
are peers; the integration job installs Pi separately at a pinned version. No
package lock is needed for the dependency-free extension itself. No paid runners,
deployment service or long-lived npm token is required. This pipeline does not
upload intermediate Actions artifacts or caches.

## Optional one-time npm bootstrap

Skip this section for GitHub-only releases. Install from Git instead:

```bash
pi install git:github.com/AnatoliyYakimov/pi-rich-ui
```

Trusted publishing is configured on an existing npm package. If the package does
not exist yet, its owner must publish the first version while signed into npm.
Do not put npm credentials in this repository or send them in chat.

1. Create/sign into an npm account and enable two-factor authentication.
2. Check out the release commit from `main` and use Node 24 or newer:

   ```bash
   npm login
   npm run check
   npm test
   npm run test:package
   npm publish --access public
   ```

   `prepublishOnly` repeats the checks before a direct local publication. npm will
   ask for any required account confirmation/OTP. If the unscoped package name is
   already owned by someone else, stop and choose an available name; update
   `package.json`, README and this document before publishing.

3. Open the package's **Settings → Trusted publishing** on npmjs.com. Add:

   | Field | Value |
   | --- | --- |
   | Publisher | GitHub Actions |
   | Organization or user | `AnatoliyYakimov` |
   | Repository | `pi-rich-ui` |
   | Workflow filename | `publish.yml` |
   | Environment | Leave empty |
   | Allowed action | Direct publishing (`npm publish`) |

4. Run **Publish** for the matching tag with `publish_npm` enabled. If the initial
   version was already published locally, the workflow skips publishing only when
   its archive has the exact same SHA-512 integrity. A different archive requires
   a new version, never replacement. Later npm publications use OIDC and include
   provenance automatically; tag pushes alone never publish to npm.

The publish runner uses Node 24 and requires npm >=11.5.1. The workflow grants
`id-token: write` only to the publishing job and `contents: write` only to the
GitHub Release job. It stores no `NPM_TOKEN` secret. See
[npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

## Subsequent releases

1. On `main`, update `version` in `package.json` and add a changelog entry. Include
   breaking changes and any updated Pi compatibility requirements.
2. Commit/push those changes and wait for the CI checks to pass.
3. Tag that exact commit and push the tag:

   ```bash
   git tag v0.5.3
   git push origin v0.5.3
   ```

4. Open **Actions → Publish** and confirm verification, checks and the GitHub
   Release job succeed. The npm `publish` job is expected to be skipped. Check the
   GitHub Release. Installation: `pi install git:github.com/AnatoliyYakimov/pi-rich-ui`.

Stable versions only are supported by this workflow. Prereleases and automated
version bumps are intentionally not enabled. For a failed GitHub release, rerun
**Publish** for the same tag with `publish_npm` unchecked. If an explicitly requested
npm publication fails, fix npm's trusted publisher configuration, then rerun for
that tag with `publish_npm` enabled. If a published package needs a correction,
increment its version and release again.

## Host compatibility

Pi 1.5.0 is the integration baseline. The native Markdown adapter uses an internal
Pi API; successful unit tests alone do not establish host compatibility. When
supporting a newer Pi, update the pinned version in both workflows and rerun the
real-host and packed-loader tests. The `*` peer ranges follow Pi's package format
and do not guarantee compatibility with every Pi release.
