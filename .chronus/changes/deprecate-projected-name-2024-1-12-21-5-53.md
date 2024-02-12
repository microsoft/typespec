---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate `@projectedName` decorator. `@encodedName` should be used instead.

Example:
```diff
-@projectedName("json", "exp")
+@encodedName("application/json", "exp")
```
