---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

OpenAPI 3.1 and 3.2 now emit `additionalProperties` for a `Record<T>` indexer, unless the model also extends another model or the schema is sealed, which still use `unevaluatedProperties`.
