---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix stray `items` being emitted on a property whose array type is encoded to a scalar via `@encode` (e.g. `ArrayEncoding.commaDelimited`).
