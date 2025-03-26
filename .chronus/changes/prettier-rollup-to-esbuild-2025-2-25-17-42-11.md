---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Moved `TypeSpecPrettierPlugin` type to internal. If wanting to use the prettier pluging programmatically, use it from the `@typespec/prettier-plugin-typespec` package
