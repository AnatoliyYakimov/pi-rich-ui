# Visual selection evaluation

The renderer tests cannot establish whether a model will choose a useful visual.
This optional A/B set compares the previous 0.6.0 guide with the current guide on
24 ordinary questions: 19 visual opportunities, one explicit table, and four plain/code
controls. Expected structures are kept out of exported model requests. Both variants
receive the same question and installed reference path, with no conversation history.
These are selection probes, not proof that every expected structure is the only good answer.

## Export requests

From the repository checkout:

```bash
npm run --silent eval:visuals -- export 3 > /tmp/rich-ui-requests.jsonl
```

This exports 144 independent requests (24 cases × two variants × three trials).
It does not contact a provider, read credentials, or spend model tokens. Each row has
`caseId`, `variant`, `trial`, `systemPrompt`, and `prompt`. Run each in a fresh context
with the same model, reasoning level, sampling, tool availability and output budget.
The order alternates between baseline and candidate across trials. Do not add the
expected tags, a request to draw, or your usual Rich UI extension prompt on top.
If your harness appends a coding-agent prompt, keep it identical for both variants.

Save the original model responses as JSONL, one per request:

```json
{"caseId":"network-peers","variant":"candidate","trial":0,"model":"provider/model-id","text":"Original complete assistant response"}
```

The baseline is a frozen copy of `GUIDE_CORE` from commit `8cda368`, without its
machine-specific reference path. The candidate is loaded from the current source.

## Score responses

```bash
npm run --silent eval:visuals -- score /tmp/rich-ui-answers.jsonl > /tmp/rich-ui-scores.json
```

The scorer uses the actual display parser and validation at 24/80 columns. Ordinary
fenced XML is literal code, not a rendered visualization. It reports, by model/variant:

- Valid visual adoption and non-table composition adoption on visual opportunities.
- Expected-structure matches, plus syntax/rendering failures.
- Unwanted visuals/tables on plain/code controls.
- Per-response tags/errors and whether both variants cover identical case/trial sets.

Unknown cases, invalid variants and duplicate model/variant/case/trial samples fail
instead of silently skewing totals. Failed provider requests must be recorded
separately and retried symmetrically; do not replace them with empty answers.

Review factual preservation, readability at the actual terminal width, relevance,
invented numbers/statuses, needless duplication, and latency/output tokens manually.
A tag match does not establish explanation quality. Do not compare unpaired totals
or interpret this small, intentionally diverse set as a production adoption rate.
There is no extra model invocation or compulsory visual-repair loop in production.

No live-model improvement percentage is claimed by this change. Unit tests exercise
the export and scorer with deterministic fixture responses only. The evaluation
scripts and frozen baseline are development files, excluded from the npm archive.
