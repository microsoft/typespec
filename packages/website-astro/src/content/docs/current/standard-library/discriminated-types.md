---
title: Discriminated Types
---

TypeSpec allows for the expression of unions and inheritance. However, when transmitting types over the network, many languages require a mechanism to distinguish between different union variants or models within an inheritance hierarchy.

To facilitate this, TypeSpec offers the [`@discriminator` decorator](./built-in-decorators#@discriminator).

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

### Implementing Unions

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
