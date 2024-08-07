---
changeKind: fix
packages:
  - typespec-vs
  - "@typespec/http-server-javascript"
---

Fixed a router bug where paths would sometimes fail to match after a parameter was bound.