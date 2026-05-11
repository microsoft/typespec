---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix serialization regression where `@clientDefaultValue` defaults on model properties were no longer included in the request body. Defaults are again materialized in the model's data dictionary at construction time so they are sent on the wire, while the attribute-access fallback for unset fields is preserved.
