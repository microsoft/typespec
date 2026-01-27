---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

[API] `serializeValueAsJson` throws a `UnsupportedScalarConstructorError` for unsupported sclar constructor instead of crashing
