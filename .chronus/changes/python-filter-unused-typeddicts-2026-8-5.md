---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Only generate `TypedDict` definitions in `types.py` when they are referenced by operation inputs or required by those input models, omitting unused response-only models.
