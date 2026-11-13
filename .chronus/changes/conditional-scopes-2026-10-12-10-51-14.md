---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add an experimental proof of concept for hierarchical scopes, hidden-by-default readonly metadata, and eagerly validated structural views, behind the auto-decorators and scoped-decorators feature flags.

```tsp
enum Clients { csharp, python }
auto dec clientName(target: unknown, name: valueof string);
@clientName("CsharpWidget") when Clients.csharp
model Widget {}
```