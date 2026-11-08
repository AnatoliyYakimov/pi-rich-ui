# Rich UI validation feedback

Date: 2026-11-08
Status: Approved for native execution; implemented and independently reviewed (no issues found).

## Intent and scope

Prevent common Rich UI syntax mistakes and let the model respond to actual validation errors instead of silently repeating invalid markup. The user selected both clearer prompt examples and one automatic correction attempt. All new examples, diagnostics, documentation, tests, and assistant responses for this work are in English. Existing support for user-language visual content remains unchanged.

This is a bounded extension change: prompt guidance, completed-answer validation, a guarded lifecycle integration, and regression coverage. No new dependencies, tools, JavaScript evaluation, automatic source rewriting, release, or installed-extension update.

## Approaches

1. **Prompt examples only:** cheap prevention, but models can still ignore instructions and cannot observe failures. Insufficient alone.
2. **Model-visible diagnostics on the next natural request:** no additional provider request, but leaves the current answer broken. Not selected as the default.
3. **Explicit examples plus one automatic correction:** selected by the user. Adds latency and token cost only when actionable invalid markup is detected. A hard attempt limit prevents correction loops.

Do not expand the parser to accept JSX arrays. The existing restricted XML contract stays intact.

## Prompt guidance

Add one short, valid English table example directly to `GUIDE_CORE`, using explicit cells and a pipe-separated header:

```xml
<Table headers="Service|Status"><Tr><Td>API</Td><Td>Healthy, no errors</Td></Tr></Table>
```

State explicitly that arrays such as `{[...]}` are unsupported. Prefer explicit `Tr/Td` cells for arbitrary prose; compact `headers`/`values` are delimiter-separated strings, not CSV. Tell the model to emit raw standalone XML, never the reserved native fence. Retain the existing composition examples if they fit a modest, tested prompt budget; do not inject the full reference.

## Validation boundary

Validation runs separately from display transformation, at Pi 1.5.0's `agent_before_settle` boundary. Rendering, scrolling, resizing, restoring history, and streaming must never send feedback or request model work.

Only inspect the current projected final assistant answer from a completed activity. Inspect text content, not thinking or tool results. Skip answers with tool calls, errors, aborts, pending messages, or ambiguous provenance. If another extension has already requested continuation or placed non-assistant context after the answer, leave it alone and allow natural work to finish first.

Use the same standalone-block/fence recognition as the display parser, sharing extraction logic rather than introducing an incompatible second syntax. Preserve existing transformation behavior and tests. Known-root malformed or unfinished blocks in a completed answer can produce diagnostics; do not independently validate their descendants. Unknown XML, inline examples, indented code, and ordinary Markdown code fences remain literal and do not trigger correction. A top-level fence explicitly using the reserved native language is a protocol mistake and receives a targeted diagnostic; a quoted/nested example remains literal.

Validate recognized blocks with `parseDocument` and the existing renderer's component checks at representative narrow and wide widths. This catches syntax errors and renderer-rejected structures, including excess table cells and invalid graph endpoints. It is not a complete schema validator or a proof that every width is valid. Preserve intentionally supported behavior such as missing table cells displaying a dash; do not invent new restrictions or try to infer what ambiguous delimiter-separated text meant.

Retain existing message/block/node/depth limits. Bound the scan to the existing block-count limit and feedback to at most three issues with short, sanitized excerpts. Do not evaluate model expressions or execute model-supplied code.

## Feedback and correction

On an actionable failure, append one extension-authored `custom_message` draft with `display: false`, then request `continue: true`. Preserve other extensions' draft entries and do not override their state on no-op paths. Include:

- Block tag and original message line when available.
- Actual parser/renderer error or a precise reserved-fence diagnostic.
- A targeted English syntax hint, with a tiny valid example when useful.
- Instructions to return corrected visual blocks only, preserving facts, labels, values, and order; do not repeat the full answer, use tools, or redo earlier work. If the visual cannot be represented safely, use ordinary Markdown instead.

The instruction against tool use is model guidance, not an enforcement sandbox; do not change the session's tool permissions or loadout.

Example feedback:

```text
Rich UI validation failed: Table at line 4.
Only scalar literals are allowed inside braces.
Arrays are unsupported. Use headers="Service|Status" and explicit <Tr><Td>...</Td></Tr> cells.
Return corrected visual blocks only, outside code fences. Preserve the content; do not use tools or repeat earlier work.
```

Keep the original assistant message unchanged in history; the correction is a new assistant message. Give a short UI notice when a correction is requested. If the correction is still invalid, show one warning and stop—no second correction request or unbounded feedback loop. Valid answers and literal examples incur no additional provider requests.

## Attempt identity and lifecycle

Allow at most one correction attempt per latest real user-message entry on the active branch. Use persisted entry identity, not user text, turn index, or `agent_start` resets. A queued steering/follow-up user message is a new request once it is consumed and persisted; extension-authored custom diagnostics are not user requests.

Store the originating user-entry ID and assistant-entry ID in the diagnostic entry's `details`. That same persisted entry is the attempt marker: do not introduce a second separately committed marker. Check the current branch for an existing marker, including after reload or compaction, and keep an in-memory guard for repeated boundary callbacks/failed proposals during a live session. A committed diagnostic consumes the attempt even if an abort or another extension suppresses continuation.

Fail closed if a trustworthy active request/answer identity cannot be established, including projections that no longer expose a usable request after compaction. Do not replay validation just because old history was restored. Custom-triggered background runs are not an excuse to repair an old user answer.

## Gating and compatibility

Enable automatic correction by default only where Rich UI model guidance is enabled: TUI mode with a Markdown transformer and `PI_RICH_UI_PROMPT` not equal to `0`. Native ANSI and public-hook text fallback both qualify.

Add `PI_RICH_UI_REPAIR=0` to disable automatic feedback/correction while keeping prompt guidance and rendering. Report the configured repair setting in `/rich-ui status`, without claiming a capability that was not probed.

Automatic correction requires Pi's actionable `agent_before_settle` API, verified against Pi 1.5.0. Keep rendering usable on older hosts; missing/unsupported boundary data means no automatic correction, not a speculative fallback to `agent_end` or queued user messages. Do not change wildcard peer dependencies or silently raise the whole package's rendering baseline.

## Verification and acceptance

- Every guide example parses and renders; table labels/content are English. Prompt injection still survives forced prompts and remains deduplicated.
- Unit coverage includes JSX arrays, delimiter-related renderer errors, malformed nesting, incomplete final roots, component-semantic errors, reserved fences, multiple blocks, limits, sanitized feedback, and all literal-code exclusions.
- Rendering and streaming output retain existing behavior and snapshots. No feedback originates from rendering.
- Lifecycle coverage proves: valid answer → zero correction requests; invalid answer → one diagnostic and one continuation; invalid correction → warning and no further continuation; a new real user request has its own budget.
- Cover mode/opt-out gates, native/text fallback, tool/intermediate messages, errors/aborts, pending user input, prior extension proposals, branch/reload markers, and ambiguous/compacted contexts.
- Exercise the packed extension with the actual Pi 1.5.0 loader and lifecycle runtime using a deterministic local provider/stream, with no external model calls or credentials. Confirm the next provider request actually receives the diagnostic and that request counts obey the limit. Report the exact host-test coverage rather than treating mocked hooks as proof of runtime behavior.
- Run active diagnostics where available, syntax checks, all unit tests, package checks, and the existing real-host Markdown tests. Update README, reference, integration contract, and changelog to describe behavior, cost, opt-out, and compatibility accurately.

## Non-goals and authorization boundaries

This validates visual syntax and renderer-supported structure, not factual correctness, privacy claims, network measurements, or whether the model chose the best visual. No repair of older stored answers, automatic fact changes, hidden deletion of history, mandatory pre-answer shell validation, new broad XML schema, or package publication. Implementation and testing begin after approval of this document and an implementation plan.
