---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Language server fatal errors now write pending logs and the fatal stack trace directly to stderr so crash details remain visible.
