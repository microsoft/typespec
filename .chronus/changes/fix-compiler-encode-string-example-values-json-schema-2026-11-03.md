---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

Emit numeric `default` and `examples` values as strings when the property or its scalar type uses `@encode(string)`, including values that come from a typed `const`.
