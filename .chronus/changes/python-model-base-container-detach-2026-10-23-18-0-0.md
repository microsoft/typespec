---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix mutations being dropped when a list, dict or set field is read with dict syntax (`model["field"]`) and then with property syntax (`model.field`). Property access no longer replaces the container already returned by dict access when deserialization leaves its elements unchanged.
