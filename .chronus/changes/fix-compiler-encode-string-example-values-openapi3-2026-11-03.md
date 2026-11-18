---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Emit numeric `default` and `example` values as strings when the property or its scalar type uses `@encode(string)`, including values that come from a typed `const` and header parameter examples. A header parameter example now uses the encoding of its scalar when the scalar defines one, instead of the default `rfc7231`. The default is kept when that encoding is `rfc3339` and the scalar is a template instance or a standard scalar such as `utcDateTime`, because its inlined header schema still says `http-date`.
