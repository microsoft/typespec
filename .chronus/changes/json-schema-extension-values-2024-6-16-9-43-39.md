---
changeKind: breaking
packages:
  - "@typespec/json-schema"
---

Updates `@extension` decorator to support TypeSpec values in addition to types.

In previous versions of the json-schema emitter, the `@extension` decorator only accepted types as the value. These are emitted as JSON schemas. In order to add extensions as raw values, types had to be wrapped in the `Json<>` template when being passed to the `@extension` decorator.

This change allows setting TypeSpec values (introduced in TypeSpec 0.57.0) directly instead.

The following example demonstrates using values directly:

```tsp
@extension("x-example", #{ foo: "bar" })
model Foo {}
```

This change results in scalars being treated as values instead of types. This will result in the `@extension` decorator emitting raw values for scalar types instead of JSON schema. To preserve the previous behavior, use `typeof` when passing in a scalar value.

The following example demonstrates how to pass a scalar value that emits a JSON schema:

```tsp
@extension("x-example", "foo")
model Foo {}
```

To preserve this same behavior, the above example can be updated to the following:

```tsp
@extension("x-example", typeof "foo")
model Foo {}
```
