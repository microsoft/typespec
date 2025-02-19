---
changeKind: feature
packages:
  - "@typespec/json-schema"
  - "@typespec/openapi3"
---

Adds `seal-object-schemas` emitter option to automatically set additionalProperties/unevaluatedProperties to `{ not: {} }` wherever possible