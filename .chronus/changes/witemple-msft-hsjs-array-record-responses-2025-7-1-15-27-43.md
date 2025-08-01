---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Corrected an error that caused Array and Record responses to fail to serialize correctly when they were variants of a Union return type.