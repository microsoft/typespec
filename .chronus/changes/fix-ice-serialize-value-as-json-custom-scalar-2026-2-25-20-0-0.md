---
changeKind: fix
packages:
  - "@typespec/compiler"
---

core - Fix ICE in `serializeValueAsJson` when a custom scalar initializer has no recognized constructor (e.g. `S.i()` with no args). Now returns `undefined` instead of crashing.
