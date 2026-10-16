---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Serialize numeric default and example values as strings when the property or its scalar type uses `@encode(string)`. They were written as JSON numbers, and an `int64` value that a JavaScript number can't represent exactly was written as `null`.
