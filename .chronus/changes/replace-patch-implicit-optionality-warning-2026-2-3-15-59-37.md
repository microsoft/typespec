---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/http"
---

Deprecate use of `@patch(#{implicitOptionality: true})`. Use the explicit `MergePatch<T>` for accurate json merge patch representation
