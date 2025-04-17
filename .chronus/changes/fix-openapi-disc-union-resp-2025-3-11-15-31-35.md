---
changeKind: fix
packages:
  - "@typespec/http"
---

Fixes issue where each variant of a `@discriminated` union was treated as a separate response instead of the whole union being treated as a single response.