# Client surface checks — context: http-client-python

## Emitter facts
*The shared `/check-client-surface` prompt and `verify.py` read these.*

- **language:** python *(selects which per-language client name applies when a check is language-scoped)*
- **generated-root:** `packages/http-client-python/tests/generated/<flavor>`
- **flavors:** `azure`, `unbranded`
- **checks-doc:** `packages/http-client-python/eng/client-surface-checks/demo-checks.json`
<!-- `node_modules/@typespec/spector/client-surface-checks.generated.md` *(precomputed)* -->

### What differs by flavor (branded = azure, unbranded)
Only the **generated-root** subfolder and the **import namespace** (`azure.core`
vs `corehttp`). Symbol locations and every concept signature below are
flavor-invariant.

## Concept signatures
What each verifiable concept looks like in generated Python. Authored once,
reused across every scenario that uses the concept. Prefer concrete, checkable
signatures so the deterministic runner can decide **without calling AI** — see
`signatures.json` for the machine-readable form.

### access: internal
- **enum** → the class is NOT re-exported from `models/__init__.py`; it may also
  be defined with a leading `_`.
- **model** → absent from the package's public `__init__.py` exports.
- **operation / method** → prefixed `_`, or not present on the public client.

### access: public
- present in the public `__init__.py` exports, no leading underscore.

### naming (`@clientName`)
- the generated identifier equals the client name **ignoring case/separators**
  (idiomatic Python casing: `snake_case`, `PascalCase`, `UPPER_SNAKE`).
- **resolving the expected name:** if the check has a `- Client names:` line
  (a per-language map, e.g. `python=…; csharp=…`), use the value whose key equals
  this emitter's **language** (`python`, from Emitter facts). Otherwise use the
  single backticked name in the `Expects` sentence. A language with no entry in
  the map is `N/A`.

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

### hierarchy (`@hierarchyBuilding`) — *AI by default, promotable*
- a client subtype is expressed as the base in `class <Sub>(<Base>, …)` in
  `models/_models.py`; inherited members are attributes present on the subclass.
- **Not** in `signatures.json` by default, so the orchestrator verifies it with
  AI. Add the `hierarchy` entry (see `signatures.promoted.json`) to run it
  deterministically via `class_base_subtype` instead — the spec assertion is
  unchanged either way.

> When an assertion has no concrete signature here (and none in signatures.json),
> `/check-client-surface` may fall back to judgment — but add a signature when
> you can, to keep AI calls rare.
