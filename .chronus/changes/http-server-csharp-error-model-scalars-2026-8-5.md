---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix generated error model constructors and numeric constraint attributes using the wrong C# types

Error model constructors declared parameters such as `DateOnly` and `Uri` while the matching properties were `DateTime` and `string`, producing code that did not compile. `NumericConstraintAttribute<T>` had the same mismatch, which stopped the converter from binding.
