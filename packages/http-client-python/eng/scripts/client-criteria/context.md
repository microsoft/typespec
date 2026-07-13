# Client surface checks — context: http-client-python

## Emitter facts

_The shared `/check-surface` prompt and `tsp-spector verify-surface-checks` read these._

- **language:** python _(selects which per-language client name applies when a check is language-scoped)_
- **generated-root:** `packages/http-client-python/tests/generated/<flavor>`
- **flavors:** `azure`, `unbranded`
- **checks-doc:** `packages/http-client-python/eng/scripts/client-criteria/surface-checks.md`
<!-- Markdown table generated from `@surfaceDoc`; both human- and machine-readable (parsed by the shared runner). -->

### What differs by flavor (branded = azure, unbranded)

Only the **generated-root** subfolder and the **import namespace** (`azure.core`
vs `corehttp`). Symbol locations and every concept description below are
flavor-invariant.

## What each check looks like

What each verifiable concept looks like in generated Python. Authored once,
reused across every scenario that uses the concept. Prefer concrete, checkable
verifiers so the shared deterministic runner can decide **without calling AI** —
see `verifiers.json` for the machine-readable declarative form (file globs +
regex patterns + casing) consumed by `tsp-spector verify-surface-checks`.

### access: internal

- **enum** → the class is NOT re-exported from `models/__init__.py`; it may also
  be defined with a leading `_`.
- **model** → absent from the package's public `__init__.py` exports.
- **operation / method** → prefixed `_`, or not present on the public client.

### access: public

- present in the public `__init__.py` exports, no leading underscore.

### naming (`@clientName`)

- the generated identifier equals the client name **recast to Python's idiomatic
  casing for the symbol kind** (case-sensitive): `enum`/`model`/`type` →
  `PascalCase`, `property`/`parameter`/`operation` → `snake_case`, enum value →
  `UPPER_SNAKE`. So an enum renamed to `ClientExtensibleEnum` must appear exactly
  as `ClientExtensibleEnum` (not `client_extensible_enum`). The per-kind casing
  map lives in `verifiers.json`; the manifest item carries the symbol `kind`
  under `details`.
- **resolving the expected name:** if the check has a `client_names` map
  (`{"python": "...", "csharp": "..."}`), use this language's value; otherwise
  `details.name`. A language with no entry is `N/A`.

### exactName (`@exactName`)

- the identifier equals the spec name **byte-for-byte**, no casing transform.

### flatten (`@flattenProperty`)

- the nested model's fields appear directly as attributes on the parent class.

### client-location (`@clientLocation`)

- an operation group is a class under `operations/_operations.py`; a method is a
  public `def` on it; the **root client** is the main `*Client` class. An
  operation is "on" a client/group when its snake_case name is a method of the
  matching class. Deterministic: assert the method is present on the
  **expected** client/group and absent from the one it moved from.

### hierarchy (`@hierarchyBuilding`)

- a client subtype is expressed as the base in `class <Sub>(<Base>, …)` in
  `models/_models.py`; inherited members are attributes present on the subclass.

> When an assertion has no concrete verifier here (and none in verifiers.json),
> `/check-surface` may fall back to judgment — but add a verifier when
> you can, to keep AI calls rare.
