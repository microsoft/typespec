---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add experimental `when { ... }` scope alternatives that select exactly one property type or operation signature per scope. The most specific matching branch wins and `else` covers the remaining scopes.

```tsp
model Widget {
  settings: when { before(Versions.v2) => string, else => Settings };
}
op getWidget when {
  before(Versions.v2) => is ReadV1<Widget>,
  since(Versions.v2) => is ReadV2<Widget>,
};
```
