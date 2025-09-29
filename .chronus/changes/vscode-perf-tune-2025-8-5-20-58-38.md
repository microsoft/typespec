---
changeKind: internal
packages:
  - "@typespec/compiler"
---

Improve the performance for the compilation in LSP, including:
  - Add a server-compile-manager to manage all compile(...) in server to make sure cache is used more efficiently
  - Separate server compile(...) into "core" and "full" modes for different scenarios
  - Update update-manager to manage doc update and trigger/cancel compile(...) more accurately with adaptive debounce delay
  - And some other small changes
