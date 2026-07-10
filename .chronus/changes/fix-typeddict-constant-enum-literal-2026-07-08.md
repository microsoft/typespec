---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix constant enum values referencing the nonexistent `_enums` module in `models-mode: typeddict`. In typeddict mode enums are emitted as `Literal` aliases in `types.py` and `_enums.py` is never generated, so a single constant enum value now annotates with its literal value (e.g. `Literal["red"]`) and no longer imports from `_enums`.
