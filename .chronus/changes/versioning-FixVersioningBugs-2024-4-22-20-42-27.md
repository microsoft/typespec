---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/versioning"
---

If a property were marked with @added on a later version, the logic that said it was originally added on the first version was erroneously removed, resulting in incorrect projections.
