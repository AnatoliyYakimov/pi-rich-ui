# Integration contract — v0.4

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

Upstream source inspected 2026-11-08 still exposes the prototype method and accepts
`Markdown(text, paddingX, paddingY, theme, defaultStyle?, {transform})`. This is source inspection,
NOT an executed compatibility result for a published Pi build.

`index.ts` imports the host `@earendil-works/pi-tui`; no private second installation is bundled.
`test:host` renders all eight v0.4 examples at widths 24,40,80,120 and checks ordinary prose and
fenced XML. It requires the user's actual installed host. This environment has no Pi.

## Not implemented

PNG/SVG, browser/React execution, fullscreen, mouse/focus routing, interactive tree expansion,
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
