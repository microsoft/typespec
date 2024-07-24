---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Fixes issue where spreading a versioned model as a parameter to an incompatible versioned operation would cause the compiler to crash.