---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix literal typekits `$.literal.create`, `$.literal.createString`, etc. use right checker api that include caching
