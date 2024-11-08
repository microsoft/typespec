---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http"
---

Uri template attributes were not extracted when parameter was explicitly mark with `@path` or `@query` as well
