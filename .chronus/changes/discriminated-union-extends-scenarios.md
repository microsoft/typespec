---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add Spector scenarios for discriminated unions with model constraints, covering explicit and injected discriminators, custom wire tags, enum discriminators, transitive inheritance, object envelopes, and recursive containers.

```tsp
model PetBase {
  name: string;
}

model Cat extends PetBase {
  meow: boolean;
}

@discriminated(#{ envelope: "none" })
union Pet extends PetBase {
  cat: Cat,
}
```
