---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Preserve every string variant when transforming nested named unions containing string scalars, so generated clients pass strict TypeScript checks.
