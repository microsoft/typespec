---
changeKind: fix
packages:
  - "@typespec/asset-emitter"
  - "@typespec/json-schema"
  - "@typespec/openapi3"
---

Fix `TypeEmitter.tupleLiteralValues` to emit tuple values as references instead of inline types. Types referenced in tuple values now propagate reference context. Circular references no longer crash.

In JSON Schema and OpenAPI 3.1/3.2 emitters, a tuple value referencing a declared model now emits a `$ref`.
