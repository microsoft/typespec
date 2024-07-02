---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/json-schema"
  - "@typespec/openapi3"
---

Fix issue that could result in invalid document generation when running `tsp compile` from another directory
