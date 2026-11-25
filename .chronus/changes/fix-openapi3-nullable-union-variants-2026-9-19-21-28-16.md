---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix invalid OpenAPI 3.0 output for a union of several types with `null`, such as `string | int32 | null`. `nullable: true` is now set on each variant of the `anyOf` or `oneOf` instead of on the wrapper schema, where OpenAPI 3.0 ignores it because the wrapper has no `type`.
