---
changeKind: internal
packages:
  - "@typespec/http-server-csharp"
---

Use Alloy's C# keyword handling and `System.Text.Json` symbols instead of local copies

Deletes the emitter's own 217-line C# keyword table and its re-declaration of the `System.Text.Json.Serialization` attributes, which are both provided by `@alloy-js/csharp`. Namespace segments that collide with common BCL type names are still renamed, now in a dedicated `getCSharpNamespaceName` helper.
