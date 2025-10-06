---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Allow importing of self (e.g. `@typespec/openapi/some/path` when in `@typespec/openapi`) respecting ESM spec.
