---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http"
---

Fix circular import causing `tsp compile --watch` breakage
