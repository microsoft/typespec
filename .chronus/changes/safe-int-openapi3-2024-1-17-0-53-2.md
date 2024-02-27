---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/openapi3"
---

`safeint` scalar now map to `type: integer, format: double-int`. To revert to the previous output of `type: integer, format: int64`. You can either:

1. Use the `safeint-as-int64` option:
  ```yaml
  # tspconfig.yaml
  options:
     "@typespec/openapi3":
        safeint-as-int64: true
  ```
2. Apply `@encode("int64", int64)` on every usage of safeint(or create a new scalar)
  ```tsp
  @encode("int64", int64)
  scalar int64Safeint extends safeint;
  ```
