---
changeKind: feature
packages:
  - "@typespec/http-server-csharp"
---

Support running `@typespec/http-server-csharp` in browser environments, making C# server generation available in the TypeSpec playground.

```tsp
@service
namespace Demo;

op ping(): string;
```