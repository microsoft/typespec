# Client surface checks — context: http-client-python

## Emitter facts

_The shared `/check-surface` prompt and `tsp-spector verify-surface-checks` read these._

- **language:** python _(selects which per-language client name applies when a check is language-scoped)_
- **generated-root:** `packages/http-client-python/tests/generated/<flavor>`
- **flavors:** `azure`, `unbranded`
- **checks-doc:** `packages/http-specs/surface-checks.md` _(generated from `@surfaceDoc`, ships with the specs)_

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

### naming

- the generated identifier equals the `expected` value from `@surfaceDoc`
  (case-sensitive match). The spec author provides the expected client name
  already in the correct casing. For Python: `enum`/`model`/`type` →
  `PascalCase`, `property`/`parameter`/`operation` → `snake_case`, enum value →
  `UPPER_SNAKE`.
- **exact per-language names:** when a name can't be derived by casing (a
  reserved-word escape, an acronym, a hard rename), the spec author supplies a
  `scope → value` dict on `@surfaceDoc` (e.g. `#{ python: "io_thing" }`). Those
  checks carry a `scope` column; the engine only runs the ones scoped to
  `python` and matches `{expected}` **verbatim**. The same `naming` routine
  handles both — no `verifiers.json` change.

### flatten

- the nested model's fields appear directly as attributes on the parent class;
  `expected` names the promoted property (blank = assert inlined).

### client-location

- an operation group is a class under `operations/_operations.py`; a method is a
  public `def` on it; the **root client** is the main `*Client` class. An
  operation is "on" a client/group when its snake_case name is a method of the
  matching class. The `expected` value names the client/group where the method
  should appear.

### hierarchy

- a client subtype is expressed as the base in `class <target>(<expected>, …)`
  in `models/_models.py`; inherited members are attributes present on the
  subclass.

> When an assertion has no concrete verifier here (and none in verifiers.json),
> `/check-surface` may fall back to judgment — but add a verifier when
> you can, to keep AI calls rare.
