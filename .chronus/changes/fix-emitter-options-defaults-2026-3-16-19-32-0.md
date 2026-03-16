---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Resolve default values from emitter options JSON schema. When an emitter defines `default` values in its JSON schema options, those defaults are now applied to `context.options` in `$onEmit`.
