---
title: Discriminated Types
---

TypeSpec allows for the expression of unions and inheritance. However, when transmitting types over the network, many languages require a mechanism to distinguish between different union variants or models within an inheritance hierarchy.

### Implementing Discriminated Unions

Unions can be marked as discriminated using the `@discriminated` decorator. This discriminator will assume the variant name is the discriminator value.

#### Default serialization

```typespec
@discriminated
union Pet {
  cat: Cat,
  dog: Dog,
}
```

Serialize as

```json
{
  "kind": "cat",
  "value": {
    "name": "Whiskers",
    "meow": true
  }
}
// or
{
  "kind": "dog",
  "value": {
    "name": "Rex",
    "bark": false
  }
}
```

#### Customize properties names

```typespec
@discriminated(#{ discriminatorPropertyName: "dataKind", envelopePropertyName: "data" })
union Pet {
  cat: Cat,
  dog: Dog,
}

model Cat {
  name: string;
  meow: int32;
}

model Dog {
  name: string;
  bark: string;
}
```

serialize as

```json
{
  "dataKind": "cat",
  "data": {
    "name": "Whiskers",
    "meow": true
  }
}
// or
{
  "dataKind": "dog",
  "data": {
    "name": "Rex",
    "bark": false
  }
}
```

### Inject discriminator inline

```tsp
@discriminated(#{ envelope: "none" })
union Pet {
  cat: Cat,
  dog: Dog,
}

model Cat {
  name: string;
  meow: boolean;
}

model Dog {
  name: string;
  bark: boolean;
}
```

serialize as

```json
{
  "kind": "cat",
  "name": "Whiskers",
  "meow": true
}
// or
{
  "kind": "dog",
  "name": "Rex",
  "bark": false
}
```

### Implementing Polymorphism

#### `string` Discriminator

```typespec
@discriminator("kind")
model Pet {
  name: string;
  weight?: float32;
}
model Cat extends Pet {
  kind: "cat";
  meow: int32;
}
model Dog extends Pet {
  kind: "dog";
  bark: string;
}
```

#### `enum` Discriminator

```typespec
enum PetKind {
  cat,
  dog,
}

@discriminator("kind")
model Pet {
  kind: PetKind;
  name: string;
  weight?: float32;
}
model Cat extends Pet {
  kind: PetKind.cat;
  meow: int32;
}
model Dog extends Pet {
  kind: PetKind.dog;
  bark: string;
}
```

#### Nested Discriminator

```tsp
@discriminator("kind")
model Pet {
  kind: string;
  name: string;
  weight?: float32;
}

@discriminator("breed")
model Cat extends Pet {
  kind: "cat";
  breed: string;
  meow: int32;
}

@discriminator("breed")
model Siamese extends Cat {
  breed: "siamese";
}

@discriminator("breed")
model Bengal extends Cat {
  breed: "bengal";
}

model Dog extends Pet {
  kind: "dog";
  bark: string;
}
```
