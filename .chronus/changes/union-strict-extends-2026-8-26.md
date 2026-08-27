---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `@strictExtends` to require every variant of a union to explicitly extend the base type declared by the union `extends` clause.

By default the `extends` clause of a union is a structural constraint: any variant with a compatible shape satisfies it. Emitters targeting languages without native unions represent such a union with a polymorphic base type, which requires each variant to actually derive from the base type.

```tsp
model Pet {
  name: string;
}
model Cat extends Pet {
  meow: boolean;
}
model Rock {
  name: string;
}

@strictExtends
union Pets extends Pet {
  cat: Cat, // ok: `Cat` extends `Pet`
  rock: Rock, // error: `Rock` has the same shape as `Pet` but doesn't extend it
}
```

`@strictExtends` can only be used when the base type is a model, a scalar or an enum, since those are the only types that can be explicitly extended. A variant that is itself a union satisfies the constraint when all of its own variants do, so unions can still be composed.
