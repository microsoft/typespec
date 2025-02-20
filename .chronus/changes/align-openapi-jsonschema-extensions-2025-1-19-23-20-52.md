---
changeKind: feature
packages:
  - "@typespec/openapi"
---

Updates the `@extension` decorator with 3 changes:

1. Removes the extension name starts with `x-` constraint.
1. Adds support for passing in values to emit raw data.
1. Adds a deprecation warning for passing in types. Passed in types will emit Open API schemas in a future release.

Scalar literals (e.g. string, boolean, number values) are automatically treated as values.
Model or tuple expression usage needs to be converted to values to retain current behavior in future releases.

```diff lang="tsp"
-@extension("x-obj", { foo: true })
+@extension("x-obj", #{ foo: true })
-@extension("x-tuple", [ "foo" ])
+@extension("x-tuple", #[ "foo" ])
model Foo {}
```
