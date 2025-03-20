---
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Add explicit `application/json` content type for some test cases to avoid wrong content type inferred from http lib.