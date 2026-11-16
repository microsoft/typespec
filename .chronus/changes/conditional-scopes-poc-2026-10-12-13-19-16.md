---
changeKind: feature
packages:
  - "@typespec/playground-website"
  - "@typespec/samples"
---

Explore conditional scopes with per-axis controls, default-versus-scoped shape comparisons, type graphs and readonly metadata for each checked view.

```tsp
enum Versions { v1, v2 }
union Value {
  legacy: int32 when Versions.v1,
  current: string when Versions.v2,
}
```
