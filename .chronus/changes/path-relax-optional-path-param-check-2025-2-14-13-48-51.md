---
changeKind: fix
packages:
  - "@typespec/http"
---

Path parameters can now be optional under specific circumstances. This fix updates the validation to ensure it doesn't trigger in these scenarios.

An optional parameter should have a leading `/` inside the `{}`.

For example:

```tsp
@route("optional{/param}/list")
op optional(@path param?: string): void;
```

Another supported scenario is using `@autoRoute`:
```tsp
@autoRoute
op optional(@path param?: string): void;
```
