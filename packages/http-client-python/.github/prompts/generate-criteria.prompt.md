---
description: 'Derive client-criteria from a spector spec''s client-shaping decorators'
agent: agent
---

Generate client-surface criteria for one scenario by reading its TypeSpec spec
and extracting the client-shaping decorators. Most criteria are just a decorator
restated, so they should be derived rather than hand-written. The rows you
produce feed `/check-client-criteria`.

Inputs:
- Scenario: ${input:scenario:substring of the spec path, e.g. naming}
- Flavor: ${input:flavor:azure or unbranded}

**Find the spec**
- azure → search `node_modules/@azure-tools/azure-http-specs/specs/` for a
  directory whose path contains the scenario.
- unbranded → search `node_modules/@typespec/http-specs/specs/` for one.
Read every `.tsp` in that spec folder (`main.tsp`, `client.tsp`, `models.tsp`…).

**Emit one criterion per client-shaping decorator**

- `@clientName("X")` (no language arg) on a model, enum, union, property, enum
  member, operation, or parameter → kind `clientName`, `expected: X`.
- `@clientName("X", "<lang>")` (language-scoped) — fold all scoped overrides for
  the same symbol into one row with a per-language map, e.g.
  `expected: python=python_name; csharp=CSName; java=JavaName; javascript=TSName`.
  Include only the languages the spec actually lists.
- `@exactName` on a symbol → kind `exactName`, `expected:` the symbol's name
  exactly as written in the spec.

For each row also record:
- `scenario`: the input scenario.
- `target`: a plain-language description naming the model / enum / operation and
  the symbol, **plus its wire name** so the checker can disambiguate. The wire
  name is the spec property/member name, unless overridden by
  `@encodedName("application/json", "<wire>")`, in which case use that.

Skip any symbol with no client-shaping decorator — its wire test already covers
it, and a client check would be noise.

**Write the result** to `eng/scripts/client-criteria/criteria.generated.md` as a
Markdown table with columns `id | scenario | kind | target | expected`. Use
stable ids of the form `<scenario>::<Model>.<symbol>`. Do not touch the
hand-written `criteria.md`.

When done, print a one-line summary: how many rows derived, and list any
decorators you saw but did not know how to turn into a criterion (so a human can
decide whether to hand-write those in criteria.md).
