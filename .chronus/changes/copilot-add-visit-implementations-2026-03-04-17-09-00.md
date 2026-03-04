---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: internal
packages:
  - "@typespec/http-client-csharp"
---

Add `Accept`/`Visit` support for `ExpressionStatement` and `InvokeMethodExpression` to the `LibraryVisitor`. This allows visitors to intercept and modify these nodes during code generation.
