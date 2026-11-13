---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Emit numeric `default` and `example` values as strings when the property or its scalar type uses `@encode(string)`, including values that come from a typed `const` and header parameter examples. A header parameter example now uses the encoding of its scalar when the scalar defines one, instead of the default `rfc7231`.
