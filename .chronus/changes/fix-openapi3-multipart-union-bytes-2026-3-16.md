---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix OpenAPI emitter failing with "Duplicate type name" error when using a named union with a `bytes` variant in a multipart body (e.g. `HttpPart<MyUnion>` where `MyUnion` includes `bytes`).
