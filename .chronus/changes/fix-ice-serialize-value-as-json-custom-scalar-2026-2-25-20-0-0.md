---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix crash when using custom scalar initializer in examples or default values
  [API] Fix crash in `serializeValueAsJson` when a custom scalar initializer has no recognized constructor (e.g. `S.i()` with no args). Now returns `undefined` instead of crashing.

