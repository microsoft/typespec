---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`FilterVisibility` now applies the visibility filter to inherited types (via `extends`), filtering out invisible properties from base models in the inheritance chain.
