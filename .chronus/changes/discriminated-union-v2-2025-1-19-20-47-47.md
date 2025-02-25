---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate use of `@discriminator` on union. Migrate to `@discriminated`

```diff lang="tsp"
-@discriminator("type")
+@discriminated(#{envelope: "none", discriminatorPropertyName: "type"})
union Pet;
```
