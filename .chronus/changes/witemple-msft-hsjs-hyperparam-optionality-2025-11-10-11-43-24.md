---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixed a bug that caused optional query/header parameters to be improperly converted to primitive types when not provided in a request.