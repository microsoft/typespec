---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Intersecting Record<T> with incompatible properties will now emit an error
