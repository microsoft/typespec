---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix the OpenAPI 3 emitter to implement the default date-time encoding when the `@header` decorator is used on date-time model properties.
