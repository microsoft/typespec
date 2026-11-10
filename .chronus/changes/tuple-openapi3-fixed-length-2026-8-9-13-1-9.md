---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Emit `minItems` and `maxItems` for tuple types so generated schemas enforce the tuple's exact length.
