---
changeKind: fix
packages:
  - "@typespec/asset-emitter"
---

Fix `TypeEmitter.tupleLiteralValues` to emit tuple values as references instead of inline types. Types referenced in tuple values now propagate reference context. Circular references no longer crash.
