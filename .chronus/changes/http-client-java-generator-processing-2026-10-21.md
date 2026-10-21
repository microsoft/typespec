---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reuse the Java formatter within each batch and avoid redundant module-info parsing.

Remove unused Java management model chains without a fixed pass limit, index partial-update matching, and reduce generator I/O and allocations. Diagnostic code-model snapshots are now opt-in through plugin debugging or the `codegen.java.dump-code-model=true` system property or environment variable.

