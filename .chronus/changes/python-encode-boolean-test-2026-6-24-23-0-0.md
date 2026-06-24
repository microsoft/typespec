---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add mock API test coverage for `@encode(string)` on boolean properties (`encode/boolean` Spector scenarios). Fix Python generator to correctly serialize and deserialize boolean values encoded as strings (case-insensitive `true`/`false`).
