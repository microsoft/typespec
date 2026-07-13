---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix compiler feature flags (e.g. `auto-decorators`) not being enabled for library code. A library can now opt into a feature via its own `tspconfig.yaml` `features`, enabling it only for that library's source files without requiring the consuming project to enable it.
