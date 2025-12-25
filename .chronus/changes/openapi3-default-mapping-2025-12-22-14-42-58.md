---
changeKind: feature
packages:
  - "@typespec/compiler"
  - "@typespec/openapi3"
---

Add support for OpenAPI 3.2.0 `defaultMapping` in discriminated unions. When a discriminated union has a default variant (unnamed variant), it is now properly emitted:
- For OpenAPI 3.2.0: The default variant is included in `oneOf` array and referenced via `discriminator.defaultMapping` property
- For OpenAPI 3.0 and 3.1: The default variant is included in `oneOf` array and its discriminator value is added to the `discriminator.mapping` object
