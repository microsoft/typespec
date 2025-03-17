---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix `utcDateTime` and `offsetDateTime` not using format `http-date` in header by default as the default http encoding defines
