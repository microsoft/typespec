---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Support inline discriminated unions with an explicit model constraint and nominal
model variants. Keep the named Python union alias and declared model inheritance,
and deserialize responses and nested properties using the configured inline
discriminator. Inject absent discriminator tags when serializing nominal variants
through the union without changing shared model instances. Distinguish same-named
aliases from different namespaces. Missing or unknown tags raise `DeserializationError`. Object
envelopes and default variants are not supported.

Handle transitive discriminator inheritance and narrowed literal discriminator
fields in TypedDict views. Update `@typespec/http-specs` to `0.1.0-alpha.45` to
cover the constrained union scenarios in synchronous and asynchronous clients.
Use TCGC `0.74.0-dev.19` union constraints and keyed variants directly, with
compatible Azure prereleases and TypeSpec compiler `1.18.0-dev.15`.

```tsp
model PetBase {
  kind: string;
  name: string;
}
model Cat extends PetBase {
  kind: "cat";
  meows: boolean;
}
model Dog extends PetBase {
  kind: "dog";
  barks: boolean;
}
@discriminated(#{ envelope: "none" })
union Pet extends PetBase {
  cat: Cat,
  dog: Dog,
}
```
