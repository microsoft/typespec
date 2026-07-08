---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add opt-in `enum-strategy` emitter option to emit TypeSpec enums as [annotated enumerations](https://spec.openapis.org/oas/v3.1.1.html#annotated-enumerations) (a `oneOf` of `const` subschemas with per-member `title`/`description`). Supported for OpenAPI 3.1.0 and above; emitting with OpenAPI 3.0.0 falls back to the default form and reports a warning.

```yaml
options:
  "@typespec/openapi3":
    enum-strategy: annotated
```

For example, the following TypeSpec:

```typespec
/** Type of pet. */
enum PetType {
  /** A loyal canine companion. */
  @summary("Dog")
  Dog: "dog",

  /** A self-sufficient feline. */
  @summary("Cat")
  Cat: "cat",
}
```

emits:

```yaml
PetType:
  description: Type of pet.
  oneOf:
    - const: dog
      title: Dog
      description: A loyal canine companion.
    - const: cat
      title: Cat
      description: A self-sufficient feline.
```
