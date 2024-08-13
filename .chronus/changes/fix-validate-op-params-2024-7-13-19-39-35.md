---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/versioning"
---

Add validation to make sure types referencing array in union types have compatible versioning.
