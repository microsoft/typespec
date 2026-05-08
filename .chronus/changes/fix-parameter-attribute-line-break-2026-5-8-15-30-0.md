---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix `MethodSignature` writer breaking lines between a per-parameter attribute and its parameter. Per-parameter attributes (e.g. `[FromRoute]`, `[FromBody]`) now stay glued to their parameter on the same line instead of being left dangling on the previous parameter's line.
