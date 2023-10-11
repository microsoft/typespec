---
title: Discriminated types
---

TypeSpec can express unions and inheritance. However, when sending types over the wire many languages need a way to discriminate between the various union variants or models in an inheritance hierarchy.

TypeSpec provide the [`@discriminator` decorator](./built-in-decorators#@discriminator) to be able to help with this pattern.

### Using polymorphism

#### `string` discriminator

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

#### `enum` discriminator

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

#### Nested discriminator

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

### Using unions

```typespec
@discriminator("kind")
union Pet {
  cat: Cat,
  dog: Dog,
}

model Cat {
  kind: "cat";
  meow: int32;
}

model Dog {
  kind: "dog";
  bark: string;
}
```
