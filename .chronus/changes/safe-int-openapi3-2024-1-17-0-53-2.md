---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add a new option `safeint-strategy` that can be set to `double-int` to emit `type: integer, format: double-int` instead of `type: integer, format: int64` when using the `safeint` scalar.
