---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reuse the Java formatter within each batch and avoid redundant module-info parsing.

Remove unused Java management model chains without a fixed pass limit, index partial-update matching, and reduce generator I/O and allocations. Keep operation-group filtering consistent across nested clients and the root compatibility view so cleanup removes schemas referenced only by filtered groups, including when all groups are removed. Diagnostic code-model snapshots are now opt-in through plugin debugging or the `codegen.java.dump-code-model=true` system property or environment variable.

Cache partial-update comment placement and member signatures, index management model references for inner-model propagation and schema naming, reuse the Java parser within formatting batches, and resolve partial-update output directories once per batch. Preserve generated output, handwritten comments, naming precedence, and source line endings.
