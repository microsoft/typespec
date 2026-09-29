---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix `tsp compile` failing with `INVALID_MODULE_EXPORT_TARGET` when the project is on a Windows network share (UNC path).
