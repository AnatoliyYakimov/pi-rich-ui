# Integration contract — v0.5

## Supported public surface

- `registerMarkdownTransformer(fn, {messageTypes:['assistant']})`: display-only string transform.
- `on('before_agent_start', ...)`: structured promptGuidelines or legacy systemPrompt extension.
- `on('agent_before_settle', ...)`: Pi 1.5.0 actionable feedback/continuation boundary;
  `message_end` observes consumed real user messages, not streaming markup.
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

## Model-visible validation feedback

Display transformation remains side-effect-free. A separate final-boundary handler
checks the current projected assistant answer, not cached render output. It reuses the
parser walk with optional diagnostic observers and checks existing renderer constraints
at widths 24 and 80. At most three bounded, sanitized issues are included in an English
`custom_message` with `customType: pi-rich-ui-validation`, `display: false`, and
`details: {version: 1, requestEntryId, assistantEntryId}`. That entry is also the durable
attempt marker. The proposal preserves earlier entries and requests one continuation;
no-op paths leave other extensions' continuation decisions untouched.

Only eligible completed user-originated TUI work is checked. Pending work, existing
continuation proposals, tool calls, errors/aborts, unsupported lifecycle previews, and
uncertain persisted provenance are skipped. Guidance disabled, missing transformer,
non-TUI mode, or `PI_RICH_UI_REPAIR=0` disables correction. A marker on the active raw
branch prevents another attempt for that request, including after restoration or
compaction; an in-memory guard prevents repeat proposals for the same live candidate.
The original answer remains untouched. A correction is another assistant message and
may cost another provider request. Tool avoidance is instructed, not enforced by a
permission change. Facts and every possible layout width are outside validation scope.

`test:package` with `PI_AGENT_MODULE` loads the archive into actual Pi 1.5.0 sessions,
replaces only the provider stream with deterministic local responses, and checks request
counts, provider-visible feedback, original history, one-attempt limits, independent
user requests, natural tool loops, queued follow-ups, errors/aborts, earlier boundary
proposals, and suppressed continuation. A fresh actual event runner also checks spent
metadata against a restored active projection; unit tests cover ambiguous/compacted
projections and additional mode/composition cases. No external model requests or user
credentials are used. This is stronger than mocked lifecycle hooks, but is not a claim
of exhaustive provider, recovery, terminal, or multi-extension compatibility.

Automatic correction requires the Pi 1.5.0 final actionable boundary. Older hosts retain
rendering; absent/unsupported boundary data produces no correction. No alternative
legacy event or fabricated user prompt is used to force continuation.

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
