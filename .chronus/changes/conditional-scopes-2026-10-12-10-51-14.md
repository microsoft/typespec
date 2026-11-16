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
model Widget {
  @Scopes.type(int32) when Clients.python
  id: string;
}
```

`@Scopes.type` and `@Scopes.signature` select scoped property types and operation signatures. Views check template constraints, model indexers, and property defaults after the ordinary source graph has been checked.