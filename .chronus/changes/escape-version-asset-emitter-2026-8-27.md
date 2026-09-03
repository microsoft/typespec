---
changeKind: fix
packages:
  - "@typespec/asset-emitter"
---

`createSourceFile` now resolves the given path strictly under the emitter output dir. Absolute roots and `..` components are dropped so a file name derived from a TypeSpec spec cannot escape the emitter output dir.
