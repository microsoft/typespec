# Union extends: language review scenarios

Language owners: suggest an SDK representation for these compiler-valid cases
(one small sketch can cover several IDs), and identify the **minimum additional
Azure authoring restrictions** required by your chosen representation. For example,
does it require direct/transitive model inheritance, prohibit overlapping unions,
or restrict direct reuse of a variant? Explain why.

This informs [Azure/typespec-azure#5390](https://github.com/Azure/typespec-azure/issues/5390);
it does not ask you to implement generator or serialization changes here.

`union extends` is a structural constraint. It does not require inheritance, add
the base as a variant, make the union open, or determine serialization.
Adding/removing it alone changes neither declared alternatives nor payloads, and
does not mandate a different generated API.

A separate Azure linter enforcing nominal model inheritance is proposed. Structural
cases such as UE02 are deliberate negative/control examples for that proposal,
not recommended Azure authoring. The restriction's precise scope is still being
discussed; compiler-valid examples help evaluate it.

<!-- prettier-ignore -->
```tsp
// Shared definitions
model Named { name: string; }
model Cat extends Named { meow: boolean; }
model Dog extends Named { bark: boolean; }
model Bird extends Named { wings: int32; }
model Fish extends Named { fins: int32; }

// UE01: Variants directly inherit the named base.
union Pets extends Named { cat: Cat, dog: Dog }

// UE02: Structural compatibility without inheritance.
model StructuralCat { name: string; meow: boolean; }
model StructuralDog { name: string; bark: boolean; }
union StructuralPets extends Named { cat: StructuralCat, dog: StructuralDog }

// UE03: Spread and model is.
model SpreadCat { ...Named; meow: boolean; }
model DogShape { name: string; bark: boolean; }
model CopiedDog is DogShape;
union ComposedPets extends Named { cat: SpreadCat, dog: CopiedDog }

// UE04: Transitive inheritance and a different compatible ancestry.
model Mammal extends Named { age: int32; }
model YoungCat extends Mammal { meow: boolean; }
model OtherBase { name: string; origin: string; }
model OtherDog extends OtherBase { bark: boolean; }
union RelatedPets extends Named { cat: YoungCat, dog: OtherDog }

// UE05: One variant in two unions with the same base.
union IndoorPets extends Named { cat: Cat, dog: Dog }
union OutdoorPets extends Named { cat: Cat, bird: Bird }

// UE06: Disjoint variants with the same base, not all descendants.
union WalkingPets extends Named { cat: Cat, dog: Dog }
union OtherPets extends Named { bird: Bird, fish: Fish }

// UE07: One variant satisfies two different named bases.
model Identified { id: int32; }
model SharedPet { name: string; id: int32; active: boolean; }
model Device extends Identified { serial: string; }
union NamedThings extends Named { shared: SharedPet, cat: Cat }
union IdentifiedThings extends Identified { shared: SharedPet, device: Device }

// UE08: The same variant used through a union AND directly.
op sendPet(pet: Pets): Pets;
op sendCat(cat: Cat): Cat;
model Holder { pet: Pets; cat: Cat; }

// UE09: Explicitly include the base as a named alternative.
union PetOrBase extends Named { cat: Cat, base: Named }

// UE10: Explicit unnamed default retains an unknown tag and modeled data.
model UnknownPet extends Named { kind: string; extra: Record<unknown>; }
@discriminated(#{ envelope: "none" })
union OpenPets extends Named { cat: Cat, dog: Dog, UnknownPet }

// UE11: Nested variant versus named/anonymous union constraint.
// The compiler retains pets: Pets as a union-valued variant, not flattened members.
union NestedPets extends Named { pets: Pets, bird: Bird }
// Pets constrains the listed variants; it does not contribute inherited alternatives.
union ConstrainedPets extends Pets { cat: Cat, dog: Dog }
union MixedValues extends string | int32 { text: string, number: int32 }

// UE12: Scalar (closed/open), enum, array, intersection, and template bases.
union ClosedStatus extends string { start: "start", stop: "stop" }
union OpenStatus extends string { known: "known", custom: string }
enum Direction { left, right }
union Directions extends Direction { left: Direction.left, right: Direction.right }
// Each variant is an array whose items structurally satisfy Named.
// Cat[] and Dog[] qualify; no Named[] alternative is implicitly added.
union PetArrays extends Named[] { cats: Cat[], dogs: Dog[] }
union Combined extends Named & Identified { shared: SharedPet }
model Wrapper<T> { item: T; }
union Wrapped extends Wrapper<string> { value: Wrapper<string> }
```

UE11's values may be Cat, Dog, or Bird; whether an SDK flattens its representation
is a language decision, not something `extends` performs or requires.
UE12's `Cat[] | Dog[]` is not `(Cat | Dog)[]`: the latter also allows mixed arrays.

## Optional, separate consideration: discriminated unions

These wire formats come from `@discriminated`, **not** `extends`. Discuss them only
when independently discriminated unions affect your representation or restrictions;
the core constraint review does not require new serialization behavior.

| Format   | Decorator on the union                  | Example Cat payload                                      |
| -------- | --------------------------------------- | -------------------------------------------------------- |
| Untagged | None                                    | `{"name":"Whiskers","meow":true}`                        |
| Inline   | `@discriminated(#{ envelope: "none" })` | `{"kind":"cat","name":"Whiskers","meow":true}`           |
| Envelope | `@discriminated`                        | `{"kind":"cat","value":{"name":"Whiskers","meow":true}}` |

For UE05/UE07, different tags or discriminator/envelope names on a reused model
may matter when the unions are independently discriminated. SDK flattening must
not change that separately defined envelope JSON. Mention nullable use, recursion,
or property conversions only if they change your answer.

UE10's default is distinct from UE09's named base alternative. It can preserve
`{"kind":"dragon","name":"Future","extra":{"color":"gold"}}`.
**Separate, deferred question (not required for this review):** Does an object-envelope
default describe the payload or the entire envelope, and how does its constraint
apply? This is [not yet specified][default-semantics].

Inline named non-model variants and anonymous model-expression bases are
compiler-invalid. Inline arrays need a separate wire design, not a claimed
compiler prohibition. Do not infer unknown-tag fallback for closed unions.

## Language response template

Group case IDs with the same answer. Serialization can be N/A unless independently
discriminated unions or conversions affect your answer.

```text
Language:
Case ID(s):
Proposed public API sketch (union/base/variants/operation signature):
Request construction:
Response handling + accessing variant-specific data:
Serialization (tags/envelopes/inheritance/conversions):
Reuse impact:
Required restrictions with concrete language/runtime reason:
```

Distinguish limitations of the chosen representation from implementation work.
Show variant-specific access and both contexts when a model is reused.

[default-semantics]: https://github.com/microsoft/typespec/blob/13043f01722ced03ca70e73175273f1f3b99267f/packages/openapi3/src/schema-emitter-3-2.ts#L83-L86
