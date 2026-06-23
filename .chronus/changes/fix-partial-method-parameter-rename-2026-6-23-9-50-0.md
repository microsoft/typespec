---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix partial method customization so the generated implementation keeps the parameter names used by its body, instead of appending a numeric suffix (e.g. `input0`) to the signature parameters.
