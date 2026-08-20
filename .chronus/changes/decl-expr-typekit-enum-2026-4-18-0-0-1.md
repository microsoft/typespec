---
changeKind: feature
packages:
  - "@typespec/compiler"
---

`$.enum.create` now produces an enum expression (`expression: true`) when given an empty `name`, mirroring `$.model.create`.
