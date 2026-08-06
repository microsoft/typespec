---
changeKind: fix
packages:
  - "@typespec/spector"
---

Print failed scenarios before the successful ones and flush stdout before exiting so the `knock` diagnostics are not truncated when the output is piped, and report the actual number of passing scenarios in the summary.
