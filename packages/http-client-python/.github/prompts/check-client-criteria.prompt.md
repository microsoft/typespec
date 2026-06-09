---
description: 'Check client-surface criteria against generated http-client-python SDKs'
agent: 'agent'
---

Verify **client-surface** behavior for generated Python SDKs — what the spector
wire tests cannot see. Renames via `@clientName`, verbatim names via
`@exactName`, relocations via `@clientLocation`, etc. all send identical bytes
on the wire, so the mock APIs pass them regardless. You check how the generated
client actually *looks*, by reading the spec's decorators and the rules for
interpreting them — not a pre-written list of expected names.

This is the **http-client-python** emitter, so the language being checked is
**python**.

Read these first:
- #file:../../eng/scripts/client-criteria/rules.md — how each client-shaping
  decorator maps to a client-surface expectation (the source of every check).
- #file:../../eng/scripts/client-criteria/context.md — how to read the generated
  Python code: folder layout, where symbols live, the baseline casing transform
  the emitter applies, client identifier vs wire value.
- #file:../../eng/scripts/client-criteria/criteria.md — hand-written rows for
  complex cases the rules can't express (usually empty).

Inputs:
- Scenario: ${input:scenario:substring of the spec/package name, e.g. naming}
- Flavor: ${input:flavor:azure or unbranded}

Steps:
1. Find the **spec** for the scenario:
   - azure → `node_modules/@azure-tools/azure-http-specs/specs/` (path contains the scenario)
   - unbranded → `node_modules/@typespec/http-specs/specs/`
   Read its `.tsp` files. This is the source of truth for what to check.
2. Find the **generated package** under `tests/generated/${input:flavor}/` whose
   folder name contains the scenario.
3. For every symbol in the spec that carries a client-shaping decorator from
   rules.md, apply the matching rule to form the expectation (resolving
   language-scoped `@clientName` to the **python** override when present), then
   locate the corresponding symbol in the generated package and read its exact
   identifier.
4. Also apply any rows in criteria.md whose scenario matches.
5. Verify per the rule's comparison (`clientName` = ignoring case/separators;
   `exactName` = byte-for-byte; etc.).

Output a Markdown table: source (decorator + spec symbol) | found identifier |
expected | PASS/FAIL/N/A | the exact line of generated code you read it from.
List separately any decorator you didn't recognize.

Report the identifier you actually found before the verdict, so a human can
verify each row from the evidence line. Do not judge style on your own.
