---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Numeric not handling trailing zeros and causing freeze(e.g. `const a = 100.0`)
