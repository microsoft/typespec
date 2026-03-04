---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Use `Record<string, T>` extends instead of `additionalProperties` property for models that are or extend record types
