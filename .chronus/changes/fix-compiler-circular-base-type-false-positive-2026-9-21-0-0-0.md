---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix a false `circular-base-type` error when a property or decorator of a model's `is`/`extends` base references another model that `is`/`extends` the derived model (e.g. `model A is B; model B { x: C } model C is A;`). The result no longer depends on declaration order. Also report `override-property-mismatch` for models checked before their base chain is complete, and report `circular-base-type` instead of crashing or hanging for cycles reached outside the base type chain (e.g. through an alias argument).
