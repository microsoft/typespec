---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

[converter] Import schema-level `examples` arrays as `@example` decorators, preserving values and order when round-tripping OpenAPI 3.1 and 3.2. Invalid non-array examples are ignored with a warning.

```tsp
@example(#{ name: "Spot" })
@example(#{ name: "Fluffy" })
model Pet {
  name: string;
}
```