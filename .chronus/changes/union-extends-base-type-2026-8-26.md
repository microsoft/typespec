---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add experimental support for an `extends` clause on union statements to constrain every variant to a common data type.

Enable the `union-extends` compiler feature in `tspconfig.yaml` to use the clause.

```tsp
model PetBase {
  name: string;
}
model Cat extends PetBase {
  toy: string;
}
model Dog extends PetBase {
  food: string;
}

union Pet extends PetBase {
  cat: Cat,
  dog: Dog,
}
```

The base type is exposed on the type graph as `Union.baseType`, giving emitters an easy way to know that all the variants of a union share a common base type. A diagnostic is reported on any variant that isn't assignable to the base type.

`extends` on a union is purely a constraint: it doesn't imply any subtyping relationship, it doesn't make the union extensible and it has no interaction with `@discriminator`.
