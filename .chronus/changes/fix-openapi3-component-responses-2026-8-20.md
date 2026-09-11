---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[converter] Emit reusable models under a `Responses` namespace for `#/components/responses/...` references instead of inlining the response at each operation
