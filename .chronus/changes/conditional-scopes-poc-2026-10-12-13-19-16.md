---
changeKind: feature
packages:
  - "@typespec/playground-website"
  - "@typespec/samples"
---

Explore conditional scopes with independent axis controls, base-versus-scoped shape comparisons and direct version/visibility examples.

```tsp
enum Versions { v1, v2 }
union Value {
  legacy: int32 when Versions.v1,
  current: string when Versions.v2,
}
```