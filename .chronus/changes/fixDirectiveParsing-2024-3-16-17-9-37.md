---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix issue where directives were not parsed to the leaf node in multi-segment Namespace segments. 
