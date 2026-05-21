---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Report an error when a function is declared in the `$functions` map in a JS file but has no corresponding `extern fn` declaration in TypeSpec. Previously this would silently have no effect.
