---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed an error in Model visibility filtering where the indexer of a model was ignored. This prevented the value of Array/Record instances from being transformed correctly, as they now should be.