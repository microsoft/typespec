---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Only emit types that belong to the service. Previously every model, enum and union declared in any imported library (`Azure.Core`, `Azure.ResourceManager`, ...) was emitted, producing large amounts of dead C# code and `anonymous-model` warnings for library types the spec author cannot change. Types declared outside the service namespace are now emitted only when the service references them, directly or transitively, and diagnostics are reported only for types the service itself declares.
