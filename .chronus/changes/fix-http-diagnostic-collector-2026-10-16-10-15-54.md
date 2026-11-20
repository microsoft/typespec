---
changeKind: fix
packages:
  - "@typespec/http"
---

Avoid duplicate HTTP diagnostics when resolving file bodies and status codes.

HTTP metadata queries now return these diagnostics instead of reporting them directly. Callers relying on that side effect outside HTTP validation should report the returned diagnostics.