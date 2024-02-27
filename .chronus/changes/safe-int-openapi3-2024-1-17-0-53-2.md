---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/openapi3"
---

The `safeint` scalar now emits to `type: integer, format: double-int`. The `double-int` format was added to the [OpenAPI Formats Registry](https://spec.openapis.org/registry/format/double-int) in November 2023 to represent integers that can be stored in a double without precision loss.

There are two options to preserve the previous emit of `type: integer, format: int64`:

1. Use the `safeint-strategy` option:
  ```yaml
  # tspconfig.yaml
  options:
     "@typespec/openapi3":
        safeint-strategy: int64
  ```
2. Apply `@encode("int64", int64)` on every usage of safeint(or create a new scalar)
  ```tsp
  @encode("int64", int64)
  scalar int64Safeint extends safeint;
  ```
