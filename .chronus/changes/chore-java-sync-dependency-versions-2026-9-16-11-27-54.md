---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix XML pagination with stream-backed responses by caching response bytes before reading items and the next link.