---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add worklist-based check queue for type checking declarations, inspired by Rust's obligation forest. Declarations are processed iteratively with deferral and retry, replacing the callback-based `ensureResolved`/`waitingForResolution` mechanism. Circular dependencies are detected via Tarjan's SCC algorithm and reported with clear cycle diagnostics.
