---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Resolve package manager versions through registry packuments so `TYPESPEC_NPM_REGISTRY` works with registries that do not support abbreviated manifest endpoints.