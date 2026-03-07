---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix extensible enum member names incorrectly getting an `Enum` suffix when the member name matched a Python reserved word (e.g. `ANDEnum` → `AND`, `CLASSEnum` → `CLASS`).
