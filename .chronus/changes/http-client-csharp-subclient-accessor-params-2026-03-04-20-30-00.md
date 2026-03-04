---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Subclient parameters are now included in accessor methods. When a subclient has parameters not present on the parent client (e.g., a resource ID for a scoped subclient that can also be created individually), the parent's accessor method now accepts those extra parameters and passes them to the subclient constructor. Caching is bypassed for parameterized accessors since different parameter values may produce different client instances.
