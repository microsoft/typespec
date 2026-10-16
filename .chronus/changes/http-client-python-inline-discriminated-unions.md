---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Support inline discriminated unions with an explicit model constraint and nominal
model variants. Keep the named Python union alias and declared model inheritance,
and deserialize responses and nested properties using the configured inline
discriminator. Missing or unknown tags raise `DeserializationError`. Object
envelopes and default variants are not supported.

```tsp
model PetBase { kind: string; name: string; }
model Cat extends PetBase { kind: "cat"; meows: boolean; }
model Dog extends PetBase { kind: "dog"; barks: boolean; }
@discriminated(#{ envelope: "none" })
union Pet extends PetBase { cat: Cat, dog: Dog }
```
