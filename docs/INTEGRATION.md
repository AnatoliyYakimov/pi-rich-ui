# Integration contract — v0.5

## Supported public surface

- `registerMarkdownTransformer(fn, {messageTypes:['assistant']})`: display-only string transform.
- `on('before_agent_start', ...)`: structured promptGuidelines or legacy systemPrompt extension.
- `registerEntryRenderer` + `appendEntry`: local examples, persisted but not model context.
- `registerCommand`, session_start/session_shutdown, current `ctx.ui.theme`.

The model emits restricted XML in standalone blocks. Parser canonicalizes namespaced tags,
validates nesting/literals/limits and emits an internal sentinel fence. The AST is cached
(maximum 48 documents); rendered lines are NOT cached by this package. Pi owns transcript
caching and invalidates on resize/theme changes.

```
assistant XML -> public Markdown transformer -> sentinel code token
             -> guarded Markdown.renderToken adapter -> layout/Surface -> ANSI strings
```

## Internal ABI (not guaranteed)

`lib/bridge.mjs` patches `Markdown.prototype.renderToken` in memory, not files. It only handles
its reserved language token, delegates all others, checks ABI with an actual Markdown probe,
and restores the original method on release. Ownership is tracked to avoid double wrappers.
Errors fall back to ordinary code rendering. Without the ABI, the public transformer emits
plain rendered text in a normal fence; without the public hook it notifies and disables itself.
The sentinel language is reserved implementation detail; don't write it manually.

Official `@earendil-works/pi-tui` **1.5.0** was installed in an isolated test directory
and used for an executed compatibility check. It exposes the prototype method and accepts
`Markdown(text, paddingX, paddingY, theme, defaultStyle?, {transform})`. No second copy is
added to the extension dependencies.

`index.ts` imports the host `@earendil-works/pi-tui`; no private second installation is bundled.
`test:host` renders 13 examples, including the new general compositions, at widths
24/40/80/120 and checks ordinary prose plus fenced XML. It requires an installed host.
An actual Pi coding agent 1.5.0 offline PTY trial also loaded index.ts, exercised
/rich-ui status, compare and titles, observed host SGR colors and NO_COLOR behavior,
and exited cleanly. Regular and fullscreen modes were exercised. The bundled CLI was tested as well, including restoring an assistant-history fixture
whose XML rendered between the original prose without a visible sentinel/code fence.
No model request was made. See [TUI smoke record](TUI-SMOKE.txt).

## Not implemented

Runtime PNG/SVG, browser/React execution, fullscreen, mouse/focus routing, interactive tree expansion,
sliders, arbitrary Markdown interpolation inside XML, graph free positioning, UML alt/loop/par,
HTML export renderer, localization of built-in service labels. Child labels remain user's language.

## Safety

No eval, no remote resources, no generated shell, no XML file reads. Source/node/depth/height
limits plus bounded LCS and chart rasterization. ANSI is produced only by the renderer/theme;
terminal control sequences from model-supplied strings are removed. This is not a sandbox
for all of Pi: the host and its other extensions retain their normal privileges.

Sources:
https://pi.dev/docs/latest/extensions
https://raw.githubusercontent.com/earendil-works/pi/main/packages/tui/src/components/markdown.ts

## Documentation previews

`scripts/preview-assets.mjs` exports the actual styled Surface cells as static SVG
with sample dark/light palettes. Structural strokes and Braille dots follow their
terminal-cell geometry; ordinary glyphs use a monospace font. This code is never
imported by index.ts or any runtime module. SVG files are README/gallery previews,
not a new output mode. Native runtime remains copyable ANSI/Unicode text.
