---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http"
---

`MergePatch` templates now allow models with metadata properties to be used as input. Those properties will be ignored(passed through as it is) 
