---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Stop wrapping `$ref` in an unnecessary `allOf` when emitting OpenAPI 3.1 (and 3.2). When a referenced schema carries sibling keywords (for example `description`, `default`, `readOnly`, or `externalDocs`), those keywords are now placed directly next to the `$ref`, as allowed by JSON Schema 2020-12. OpenAPI 3.0 output is unchanged, since it does not permit sibling keywords next to a `$ref`.