---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Apply JSON schema `default` values to emitter options so they appear in `context.options` during `$onEmit`.
