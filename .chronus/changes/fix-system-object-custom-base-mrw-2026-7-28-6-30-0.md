---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix model reader/writer serialization for models whose base type is supplied by customization or by an external/system type. The generated `*Core` methods now only defer to a hand-authored base when that base actually takes part in the model reader/writer pattern, so a plain grouping base class no longer widens the `*Core` return type and produce covariant overrides that fail to compile on `netstandard2.0`.
