# Rich UI Validation Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the model a correct table example and bounded, actionable feedback with one automatic correction attempt when its final Rich UI markup fails validation.

**Architecture:** Reuse the existing Markdown parser's recognition rules for diagnostics without changing display behavior. Validate syntax and renderer-supported structure, then use Pi 1.5.0's final actionable boundary to append a diagnostic and request one continuation. Persist request attribution in diagnostic metadata so continuations and restored branches cannot reset the budget.

**Tech Stack:** Dependency-free JavaScript ES modules, Node's built-in test runner, existing XML/Surface renderer, Pi 1.5.0 extension lifecycle and deterministic offline host tests.

**Spec:** `docs/superpowers/specs/2026-11-08-rich-ui-validation-feedback-design.md`

## Execution Result

Native execution completed on `feat/validation-feedback` in `.worktrees/validation-feedback`. After implementation and review, the user explicitly authorized integration into `main` and a tagged GitHub release (v0.5.4); that authorization supersedes the original no-commit/push/release boundary below.

- [x] Task 1: English table guidance and syntax warnings; 1,907-character core.
- [x] Task 2: Shared-walk, bounded syntax/renderer diagnostics; existing snapshots unchanged.
- [x] Task 3: Final-boundary feedback, durable attempt attribution, opt-outs and safe gating.
- [x] Task 4: Packed actual-Pi offline lifecycle regressions; baseline failure reproduced.
- [x] Task 5: Documentation, 359/359 tests, syntax/package/actual-host checks, and fresh read-only review (OK; no issues found).

No live-provider compliance, physical-terminal, exhaustive all-width, or all-host/recovery compatibility claims are made. The initial implementation stopped before commit/push/merge/release; those integration steps were subsequently authorized. Updating the globally installed extension remains separate. The detailed execution ledger and test logs are session scratch artifacts; the checkboxes below retain the original implementation instructions.

## Global Constraints

- All new examples, diagnostics, documentation, tests, and assistant responses for this work are in English. Existing user-language visual support remains unchanged.
- No new dependencies, tool declarations, JavaScript evaluation, automatic source rewriting, hidden history deletion, release, or installed-extension update.
- One correction attempt per latest real persisted user-message entry on the active branch. A committed diagnostic consumes the budget, even when continuation is suppressed.
- Skip streaming/intermediate/tool/error/aborted/ambiguous answers and pending work. Literal code examples must not trigger repair.
- Preserve other extensions' boundary proposals. Fail closed on unsupported host data or uncertain provenance.
- TUI plus transformer plus enabled guidance is required; `PI_RICH_UI_REPAIR=0` disables correction independently of rendering.
- Keep wildcard peer dependencies and existing parser semantics. Automatic correction is verified on Pi 1.5.0; older rendering hosts receive no speculative lifecycle fallback.
- Do not commit, push, publish, or update the globally installed copy as part of this work. Keep reviewable local changes.

## Review Focus

- A malformed root containing valid descendants must produce one diagnostic, never turn its descendants into independent visuals: Task 2.
- A native-sentinel example nested inside a longer documentation fence must stay literal, unlike a top-level reserved fence: Task 2.
- Extension-authored custom messages must not be confused with persisted real user requests: Tasks 3–4.
- A queued follow-up consumed in the same agent run must have a new budget, whereas another low-level agent start must not: Tasks 3–4.
- A diagnostic persisted just before an abort/reload must still consume the attempt, including when no correction response was generated: Tasks 3–4.

---

## File Structure

- Modify `lib/prompt.mjs`: compact table example and explicit syntax prohibitions.
- Modify `lib/parser.mjs`: optional diagnostic callbacks on the existing standalone-block/fence walk; normal transformation remains unchanged.
- Create `lib/validation.mjs`: bounded validation issues and English feedback formatting.
- Create `lib/feedback.mjs`: answer/request selection, branch marker checks, and guarded boundary proposals.
- Modify `lib/extension.mjs`: wire the boundary handler, gate/notice behavior, repair status.
- Modify `tests/prompt.test.mjs`, `tests/parser.test.mjs`, `tests/integration.test.mjs`; create `tests/validation.test.mjs` and `tests/feedback.test.mjs`.
- Create `scripts/test-feedback-host.mjs`: reusable deterministic actual-Pi lifecycle checks for the packed extension; call it from `scripts/test-package.mjs` when `PI_AGENT_MODULE` is available. Existing scripts/package/check discovery covers the new script without a dependency or CI workflow change.
- Update `README.md`, `docs/REFERENCE.md`, `docs/INTEGRATION.md`, and `CHANGELOG.md`: accurate guidance, correction costs/limits, opt-out, and host compatibility.

### Task 1: Make the table contract explicit in the compact guide

**Interfaces:** Retain exports `GUIDE_CORE`, `SYSTEM_GUIDE`, `REFERENCE_PATH`, and `injectGuidance(event, enabled)` unchanged. Add one parseable single-line table example using `headers="Service|Status"` and explicit cells, including a comma in cell text.

- [ ] Add a failing prompt test asserting four purpose-labeled composition examples, including the explicit-cell table; assert a direct arrays prohibition, delimiter guidance, and no manual reserved fences. Every example must transform and render at widths 24, 40, and 80.
- [ ] Run `node --test tests/prompt.test.mjs tests/integration.test.mjs`; confirm failures arise from missing guidance/example rather than fixture errors.
- [ ] Make the smallest guide edit. Keep `GUIDE_CORE` within 2,100 characters and the installed guide within the existing 2,300-character test budget where the fixture installation path allows; update only the relevant budget/example assertions. Preserve forced-prompt injection behavior.
- [ ] Run the two test files again; all pass. Record the measured core size rather than leaving stale hard-coded documentation claims.

### Task 2: Reuse block recognition for bounded validation diagnostics

**Interfaces:** Extend `transformMarkdown(source, options)` with optional `onError(issue)` and `onReservedFence(issue)` callbacks. A parser issue has `{line, tag, error}` plus a bounded excerpt when available; line numbers are one-based. Callbacks are inert when omitted. Create `validateMarkdown(source) -> Issue[]` in `lib/validation.mjs`, where an issue is `{line, tag, message, hint, excerpt}`. Create `formatFeedback(issues) -> string`; return at most three issues and cap the full feedback at 2,400 characters, with excerpts capped at 160 characters and sanitized using `clean`.

- [ ] Add failing tests for array attributes, mismatched/unclosed known roots, renderer-rejected excess table cells and graph endpoints, multiple invalid blocks, and a valid explicit-cell table containing commas and pipes.
- [ ] Add tests for normal fenced XML, tilde fences, inline/indented examples, unknown XML, prose-sharing closing lines, valid descendants of invalid roots, and top-level versus nested reserved-language fences. Ordinary literal cases produce no issues and preserve transformation byte-for-byte.
- [ ] Run `node --test tests/parser.test.mjs tests/validation.test.mjs`; verify the new assertions fail before implementation.
- [ ] Add callbacks to the existing parser walk without widening display eligibility. Add validation using parse-success callbacks and `renderDocument(ast, width, {monochrome:true})` at widths 24 and 80. Capture renderer failures as issues; use targeted English hints for array, table-schema, and reserved-fence mistakes. Do not add new table restrictions or infer delimiter intent.
- [ ] Test message/source/block-count bounds, at most three issues, clipped excerpts, stripped terminal controls, and feedback instructions that preserve content, prohibit tools/repeated work, and permit a plain Markdown fallback.
- [ ] Run the focused tests plus `node --test tests/render.test.mjs tests/snapshots.test.mjs`; all pass without updating existing golden snapshots.

### Task 3: Deliver guarded final-answer feedback

**Interfaces:** Export `createFeedbackHandler({enabled, notify}) -> (event, ctx) => BoundaryResult | undefined` from `lib/feedback.mjs`. `enabled(ctx)` applies mode/environment/transformer gating. `notify(ctx, message, severity)` delegates to the optional host UI. Use custom type `pi-rich-ui-validation`; diagnostic `details` contains `{version:1, requestEntryId, assistantEntryId}`. A returned result preserves `event.entries` and appends one `custom_message` with `display:false`, plus `continue:true`.

- [ ] Add failing feedback tests with realistic projected entries, branch entries, and messages. A valid final answer returns `undefined`; invalid final markup returns exactly one diagnostic/continuation; a repeated boundary for the request returns no new continuation and warns only once if still invalid.
- [ ] Add cases for prior boundary drafts/continuation, pending messages, thinking-only output, tool calls, tool results, failed/aborted outcomes, missing preview fields/session identity, custom-triggered runs, and projection/context edits that obscure provenance. They must fail closed without discarding prior state.
- [ ] Add budget tests for distinct real user-entry IDs, queued user messages, extension custom messages, fresh handler instances reading a persisted diagnostic, branch switching, compaction retaining raw markers, and a persisted marker without a correction response. Reusing identical user text with a new entry ID is a new request.
- [ ] Run `node --test tests/feedback.test.mjs tests/integration.test.mjs`; observe new tests fail before implementation.
- [ ] Implement request/answer attribution from `event.context.contextEntries` and the active persisted branch. Confirm the final projected assistant and latest real user message have trustworthy source IDs; skip ambiguous cases. Use diagnostic details as the durable marker plus an in-memory request guard. Add no state-changing hooks on display/history restoration.
- [ ] Wire `agent_before_settle` in `lib/extension.mjs`. Track whether the active run is user-originated from `before_agent_start`; retain guidance injection semantics. Include native/text fallback, `PI_RICH_UI_PROMPT=0`, `PI_RICH_UI_REPAIR=0`, missing transformer, non-TUI, and disposal gates. Report configured repair setting in status. Missing modern lifecycle context is a no-op.
- [ ] Run all focused feedback/integration tests, including no notices or provider-related effects from repeated render/stream calls; all pass.

### Task 4: Prove behavior in the actual packed Pi lifecycle

**Interfaces:** Export `testFeedbackHost({installed, agentModule, tui}) -> Promise<void>` from `scripts/test-feedback-host.mjs`. `installed` is the unpacked extension root; `agentModule` identifies the installed Pi extension loader as in the existing package script. Run with temporary isolated session resources and a deterministic local provider/stream. Never contact a live provider, reuse credentials, or mutate the user's live sessions.

- [ ] Read the installed Pi extension/SDK docs and required examples in full before implementing the runtime integration. Use actual host APIs and source contracts, not invented mock equivalents.
- [ ] Add an offline actual-Pi test: load packed `index.ts`, submit a real user request, return invalid array markup from the fake provider, assert the next request receives the English custom diagnostic, then return a valid visual. Assert exactly two provider requests and preserved original history. Run against the pre-feature extension to observe the missing second request.
- [ ] Add actual runtime scenarios for a valid initial answer (one request), invalid correction (two total requests), a new user request receiving a fresh budget, one natural tool loop without replayed tools, queued follow-up attribution, and error/abort behavior. Test preservation of an earlier extension's boundary entries and deferral when another continuation is already pending.
- [ ] Prove marker reconstruction from a restored branch and a committed diagnostic with suppressed continuation; ambiguous or compacted-away request identity must skip repair rather than guess. Keep deeper boundary-composition permutations covered by deterministic unit tests and report that distinction.
- [ ] Integrate with `scripts/test-package.mjs` under its existing `PI_AGENT_MODULE` gate. Keep standalone package checks passing without host modules. Verify all resources are disposed and temporary files stay under the session scratch directory.
- [ ] Run the actual host/package command with the installed Pi 1.5.0 modules; confirm captured provider requests, context diagnostics, and history—not merely handler return values.

### Task 5: Document, review, and verify the integrated change

**Interfaces:** No new runtime interfaces. Document behavior implemented in Tasks 1–4, not aspirations.

- [ ] Update README/reference/integration contract/changelog with the table example, default one-attempt repair, extra-request cost, opt-out, append-only history, TUI gating, and Pi 1.5.0 boundary requirement. Remove stale statements that invalid blocks are never repaired or that the guide has exactly three examples/its old character count. Keep all added prose English.
- [ ] Run active LSP diagnostics on changed JS/TS paths where supported; report unavailable coverage honestly. Run `npm run check`, `npm test`, `npm run test:package`, and real-host `test:host`/packed lifecycle checks using `PI_AGENT_MODULE` and `PI_TUI_MODULE` pointing at the installed 1.5.0 host.
- [ ] Inspect the complete diff for scope, new dependency/schema/tool additions, accidental source rewriting, test-only false confidence, unbounded feedback, and false-positive correction triggers.
- [ ] Request one fresh read-only review of the actual integrated diff, focusing on loop prevention, request attribution, literal-code isolation, compatibility, and real-host evidence. Address concrete findings and rerun affected checks; no model escalation or extra review fanout without a material reason.
- [ ] Summarize changes, passing commands and exact counts, review outcome, and meaningful limitations. Explicitly state that nothing was committed/pushed/released or installed globally.

## Plan Self-Review

The five tasks cover every design section: prevention (1), syntax/structure validation and bounded English feedback (2), lifecycle/budget/gating/history (3), actual runtime evidence and coexistence (4), and documentation/regression verification (5). Review-focus cases have explicit owner tests. Interfaces and metadata names are consistent across tasks. Builders may choose local fixture layout and internal helper functions without changing the specified external behavior.
