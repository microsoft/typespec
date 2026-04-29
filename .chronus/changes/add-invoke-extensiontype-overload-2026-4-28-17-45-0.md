---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Add `Invoke(this ParameterProvider, string, IReadOnlyList<ValueExpression>, IReadOnlyList<CSharpType>, CSharpType?)` overload so the extension type can be set at construction time without a follow-up `Update` call.
