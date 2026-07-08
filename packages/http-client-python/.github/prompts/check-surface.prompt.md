---
description: "Orchestrate surface checks: one parallel deterministic batch, then AI for the rest"
mode: "agent"
---

You are the **orchestrator** for surface checks on an emitter's generated
SDK — properties (naming, visibility/access, shape) the wire tests can't see.
You verify every check in **two parallel phases**, not one-by-one:

1. **Deterministic phase (parallel, no AI).** One batch call runs every check
   whose category has a routine — concurrently.
2. **AI phase (only the leftovers).** You verify the few checks with no
   deterministic routine; dispatch them in parallel if there are several.

Read:

- `packages/${input:emitter}/eng/scripts/client-criteria/context.md` — Emitter
  facts (language, generated-root, flavors, checks-doc path) and concept prose.
- The **checks doc** — the `checks-doc` JSON named in `context.md` (default
  `surface-checks.json`): the batch runner reads it for deterministic checks and
  you read its items' `doc` prose for the AI ones. Use this path unless the caller
  explicitly overrides it.
- `packages/${input:emitter}/eng/scripts/client-criteria/verifiers.json` — the
  routing table: a category listed here is deterministic; one not listed is AI.

Inputs:

- Emitter: ${input:emitter:package folder, e.g. http-client-python}
- Flavor: ${input:flavor:one of the flavors in the emitter's context.md}
- Scenario: ${input:scenario:optional substring filter on the check id}

## Phase 1 — deterministic batch (parallel)

Run the batch tool **once**. It runs all deterministic checks in parallel and
prints `{"results": [...], "needs_ai": [...]}`:

```
python packages/${input:emitter}/eng/scripts/client-criteria/verify.py --batch \
  --checks packages/${input:emitter}/eng/scripts/client-criteria/<checks-doc from context.md> \
  --verifiers packages/${input:emitter}/eng/scripts/client-criteria/verifiers.json \
  --generated-root <generated-root from context.md> \
  --flavor ${input:flavor} --language <language from context.md> --workers 16
```

Take `results` as-is — each is a deterministic verdict (`how: deterministic`).
Do not re-check or second-guess them.

## Phase 2 — AI verification (the residual, in parallel)

For each item in `needs_ai`, verify it yourself: find the target in the generated
package under `<generated-root>/<flavor>/` (folder matching the scenario), judge
against its `verify` text and context.md, and cite the exact file + line. Mark
`how: ai`. **If there are several, dispatch them as parallel subagents** (one per
item) rather than serially, then collect the verdicts.

## Phase 3 — merge

Combine `results` + your AI verdicts into one table, filtered by the scenario
input if given:

`id | category | result (PASS/FAIL/N/A) | how (deterministic/ai) | evidence`

End with a summary: pass/fail counts, and how many were code vs AI.

The point: the deterministic bulk is one parallel call decided by code; AI is
spent only on the checks that actually need judgment.
