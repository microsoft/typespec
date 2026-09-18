---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Prevent duplicate named union aliases, and preserve ETag and match-condition parameter types in generated body overloads while emitting the paired conditional header with its canonical HTTP casing (`If-Match` / `If-None-Match`).
