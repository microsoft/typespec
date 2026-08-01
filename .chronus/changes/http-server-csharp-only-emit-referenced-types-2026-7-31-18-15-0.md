---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Only emit types that belong to the service. Types declared outside the service namespace, for example in an imported library, are now emitted only when the service references them, directly or transitively.
