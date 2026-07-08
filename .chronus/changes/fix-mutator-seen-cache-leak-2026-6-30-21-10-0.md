---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix memory leak in the experimental mutator engine where a module-level `seen` cache pinned the type graph of every mutated program in memory for the lifetime of the process. The cache is now scoped per `Program` (via a `WeakMap`), so it is released once the program is garbage collected while still being shared across the nested mutations required for recursive type graphs to terminate.
