---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[Converter] fixed a bug in which union definitions converted from `oneOf`/`anyOf` definitions in OpenAPI3 schemas were missing semicolon delimiters.
