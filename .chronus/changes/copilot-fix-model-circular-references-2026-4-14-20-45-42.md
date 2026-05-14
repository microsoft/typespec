---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed the compiler to correctly detect circular model spread chains while preserving support for recursive model-expression aliases.
