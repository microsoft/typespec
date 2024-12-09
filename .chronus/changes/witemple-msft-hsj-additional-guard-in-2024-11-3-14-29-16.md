---
changeKind: fix
packages:
  - "@typespec/http-server-javascript"
---

Fixed a null check in query parameter requiredness check by replacing it with a falseness check.
