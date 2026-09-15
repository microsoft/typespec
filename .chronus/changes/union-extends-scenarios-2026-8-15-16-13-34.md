---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add union extends Spector scenarios covering structural constraints, model reuse, serialization formats, and exact request/response fixtures.

```typespec
model Named { name: string; }
model Cat extends Named { meow: boolean; }
model Dog { name: string; bark: boolean; }
union Pet extends Named { cat: Cat, dog: Dog }
```

The matrix includes representative unions without `extends` for language API comparisons.