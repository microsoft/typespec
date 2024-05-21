---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/versioning"
---

Fix issue with `@removed` decorator if model was not added from beginning.
