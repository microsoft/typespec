---
changeKind: internal
packages:
  - "@typespec/compiler"
---

Refactor `tsp init` template loading around a `TemplateSource` abstraction (filesystem, in-memory, and remote sources) instead of resolving templates through `CompilerHost.getExecutionRoot()`.
