---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Enabled resolution of member properties and metaproperties through template parameters based on constraints.

```tsp
model Resource {
  id: string;
}

model Read<R extends Resource> {
  id: R.id;
}
```
