---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fixed a bug that caused `model M is T[]` declarations to be renamed to `MItem` incorrectly.