---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

Emit `minItems` and `maxItems` for tuple types so generated schemas enforce the tuple's exact length.
