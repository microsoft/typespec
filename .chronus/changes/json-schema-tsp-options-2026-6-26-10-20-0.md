---
changeKind: internal
packages:
  - "@typespec/json-schema"
---

Migrate the JSON Schema emitter to define its options as a TypeSpec model (`options/main.tsp`, exported via `exports["./options"].typespec`) instead of a hand-written JSON schema. The compiler now validates user options against that model. Removes the internal `EmitterOptionsSchema` export.
