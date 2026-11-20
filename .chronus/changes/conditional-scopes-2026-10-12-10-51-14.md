---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add an experimental proof of concept for conditional scopes behind the `scoped-decorators` feature flag. A `when` clause makes declarations, members and decorator applications conditional on enum members, which can form a hierarchy through `@Scopes.parent`. The default view has every condition false, and each distinct scope view is compiled and checked on its own.

```tsp
enum Clients { csharp, @Scopes.parent(Clients.csharp) provisioning, python }
auto dec clientName(target: unknown, name: valueof string);
@clientName("CsharpWidget") when Clients.csharp
model Widget {
  @Scopes.type(int32) when Clients.python
  id: string;
}
```
