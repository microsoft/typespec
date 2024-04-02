---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix crash: emit `{nullable: true}` when trying to emit `null` in openapi3
