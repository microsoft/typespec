---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Stop running decorators on partially instantiated operations(When interface is instantiated but not the operation)
