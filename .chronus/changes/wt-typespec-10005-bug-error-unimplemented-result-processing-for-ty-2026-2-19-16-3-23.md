---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

handle immediate scalar-typed and value-literal typed responses in result processing layer to prevent crash when an operation returns a bare scalar or value literal
