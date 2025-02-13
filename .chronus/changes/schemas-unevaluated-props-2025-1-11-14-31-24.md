---
changeKind: feature
packages:
  - "@typespec/json-schema"
  - "@typespec/openapi3"
---

Updates JsonSchema and Open API 3.1 emitters to use unevaluatedProperties instead of additionalProperties, and updates Open API 3 emitters to match JsonSchema behavior of treating `Record<never>` as setting `additionalProperties: { not: {} }`