---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Propagate service errors from synchronous ARM long-running operations instead of returning null or silently succeeding.
