---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Add a debug-level summary log of back-compatibility changes (replacements / updates applied due to a library's last contract). Entries are grouped by category (e.g. "Method Parameter Reordering", "Parameter Name Preserved", "Property Collection Type Preserved", "Constructor Modifier Preserved", "AdditionalProperties Type Preserved", "Enum Member Reordering", "Api Version Enum Member Added From Last Contract", "Model Factory Method Added/Replaced For Back-Compat") and emitted once at the end of code generation, making back-compat decisions easy to discover in generator logs.
