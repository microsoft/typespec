---
changeKind: feature
packages:
  - "@typespec/http-server-js"
---

Enabled 'text/plain' serialization for scalars that extend `TypeSpec.string`.

Enabled fallback logic for all unrecognized content-types with a body type that is or extends `TypeSpec.bytes`.

Enhanced route differentiation logic for shared routes, allowing them to differentiate routes in more cases using headers other than `content-type`.
