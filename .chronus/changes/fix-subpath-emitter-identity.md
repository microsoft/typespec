---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Resolve emitters exported from package subpaths using their declared `$lib.name`, giving each emitter its own options, default output directory, and runtime reporting. Package-keyed options remain supported as a fallback.
