---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix false-positive `duplicate-using` diagnostic when a `using` statement appears before a file-level (blockless) namespace declaration and the same namespace is also used inside the file namespace.
