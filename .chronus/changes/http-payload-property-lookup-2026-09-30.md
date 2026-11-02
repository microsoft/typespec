---
changeKind: fix
packages:
  - "@typespec/http"
---

Improve HTTP payload resolution performance for models with many properties by avoiding repeated metadata scans.
