---
changeKind: internal
packages:
  - "@typespec/compiler"
---

Introduce internal `TypeGraph` concept (a self-contained compilation result) and experimental support for defining emitter options as a TypeSpec file (`exports["./options"].typespec`). Emitters opt into validating user options against their exported `EmitterOptions` model via the `experimentalEmitterOptions` package flag (`definePackageFlags`).
