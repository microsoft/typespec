---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add `--httpSpecsDir`, `--azureSpecsDir`, and `--no-baseline` flags to `regenerate.ts` so the language-agnostic `eng/emitter-diff` tool can drive code generation against pinned specs without cloning the published baseline.
