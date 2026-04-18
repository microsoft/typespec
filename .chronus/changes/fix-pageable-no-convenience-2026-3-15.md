---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix uncompilable C# generated for pageable operations annotated with `@convenientAPI(false)`. The anonymous response model containing the `@nextLink`/`@continuationToken` property is now included in the code model so the generated `CollectionResult` class can reference it.
