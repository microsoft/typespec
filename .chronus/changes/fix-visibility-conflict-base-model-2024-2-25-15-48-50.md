---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix visibility naming conflict when a model used with `extends` was used in different visibility.
