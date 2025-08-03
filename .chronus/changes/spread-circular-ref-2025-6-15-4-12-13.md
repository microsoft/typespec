---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Ensure model that are spread, intersected or used as the base are fully checked before trying to copy the properties
