---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Remove now-unused `using` directives during post-processing. When internalizing unreferenced public types and pruning the corresponding model factory methods, any `using` directive left unused (flagged by the C# compiler's `CS8019` diagnostic) is now removed from the affected documents.
