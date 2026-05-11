---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix back-compat overloads generated for service methods so that:

- Named-argument labels in the delegating call use the C# variable name when the previous parameter's raw input name is not a valid C# identifier (for example OData query parameters such as `$select`, `$top`, `$skip`, `$count`).
- A trailing `CancellationToken cancellationToken` parameter is preserved as optional (`= default`) on the back-compat overload so the generated method continues to satisfy the SDK guideline that requires client convenience methods to end with an optional `CancellationToken`.
