---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/versioning"
---

Use of `@useDependency` is now optional when referencing types from a versioned library. By default the latest version of the library will be used.
