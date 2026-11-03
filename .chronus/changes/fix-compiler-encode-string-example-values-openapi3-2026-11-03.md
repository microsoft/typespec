---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Emit numeric `default` and `example` values as strings when the property or its scalar type uses `@encode(string)`, including values that come from a typed `const`.
