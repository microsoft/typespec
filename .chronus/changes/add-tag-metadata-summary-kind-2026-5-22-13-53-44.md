---
changeKind: feature
packages:
  - "@typespec/openapi"
  - "@typespec/openapi3"
---

Add `summary` and `kind` fields to `@tagMetadata` decorator.

For OpenAPI 3.2, these fields are emitted as native tag object fields. For OpenAPI 3.0/3.1, they are emitted as `x-oai-summary` and `x-oai-kind` extensions. The OpenAPI converter also supports importing `x-oai-summary`, `x-oai-kind` (from 3.0/3.1) and native `summary`, `kind` (from 3.2) back to TypeSpec.

```typespec
@tagMetadata("foo", #{ summary: "all operations that allow doing Foo", kind: "FooGroup" })
```
