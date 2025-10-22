---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix issue where namespace with same name but different parent would get merged together when under a file namespace scope. 
