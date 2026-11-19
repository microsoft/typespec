---
changeKind: feature
packages:
  - "@typespec/compiler"
---

`tsp init` adds `bin/` and `obj/` to the generated `.gitignore` when the C# server emitter is selected. Init templates can list `gitignorePatterns` for each emitter to add their own lines.
