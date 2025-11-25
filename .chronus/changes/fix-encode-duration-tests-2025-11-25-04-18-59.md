---
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Fix EncodeDuration tests with larger unit durations being too strict by making query parameter expectations match input types as numbers instead of strings
