---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Warnings converted to error with `warn-as-error` do not prevent compilation from moving to the next stage like regular warnings
