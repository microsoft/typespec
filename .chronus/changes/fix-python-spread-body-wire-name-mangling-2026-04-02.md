---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Python emitter using mangled name (e.g. `items_property`) instead of the original wire name (e.g. `items`) when building request bodies from spread body parameters whose names match Python Mapping protocol methods.
