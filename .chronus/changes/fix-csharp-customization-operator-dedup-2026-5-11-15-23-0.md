---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix CS0111 caused by duplicate operators when a customization partial declares its own `==`, `!=`, `implicit`, or `explicit` operators. The signature comparer used by the customization dedup paths now correctly matches operator methods between the generated partial and the customization partial.
