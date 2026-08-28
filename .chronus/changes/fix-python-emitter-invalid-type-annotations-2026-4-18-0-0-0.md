---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix invalid Python type annotations generated in `types.py` files. Internal enums used as TypedDict fields are now imported (as a bare symbol) from their private `_enums` submodule so the annotation resolves; duplicate runtime + `TYPE_CHECKING` imports of the same symbol are deduplicated to avoid `no-redef`; and TypedDicts that change an inherited field's requiredness are emitted as a flat (non-inheriting) TypedDict to satisfy PEP 589.
