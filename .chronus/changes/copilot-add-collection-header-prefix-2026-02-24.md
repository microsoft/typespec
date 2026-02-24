---
changeKind: feat
packages:
  - "@typespec/http-client-csharp"
---

Add `collectionHeaderPrefix` client option support for dictionary request headers. When the `@clientOption("collectionHeaderPrefix", "prefix", "csharp")` decorator is applied to a dictionary header parameter, the generator will emit code that prepends the prefix to each key in the dictionary using an extension method on `PipelineRequestHeaders`.
