---
changeKind: breaking
packages:
  - "@typespec/openapi3"
---

Updates the `@extension` behavior to emit Open API schemas for passed in Types. Values will continue to be emitted as raw data. Model and Tuple expressions that were previously treated as Values are now treated as Types.

Now the following TypeSpec:
```tsp
@OpenAPI.extension("x-value", "custom value")
@OpenAPI.extension("x-schema", typeof "custom value")
model Foo {}
```
emits the following Open API:
```yaml
Foo:
  type: object
  x-value: custom value
  x-schema:
    type: string
    enum:
      - custom value
```
