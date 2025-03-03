---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Migrate `@service` decorator options to take in a value

```diff lang="tsp"
-@service({title: "My service"})
+@service(#{title: "My service"})
```
