---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Avoid emitting duplicate output for required nullable properties during patch serialization. The null fallback for a required nullable property is now gated on `!Patch.Contains(...)` so patched values remain the single source of output for that property.
