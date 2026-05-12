---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix TypeSpec `numeric` scalar type being emitted as `int` in Python; it is now emitted as `float`.
