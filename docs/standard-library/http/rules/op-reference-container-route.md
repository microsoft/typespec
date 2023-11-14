---
title: @typespec/http/op-reference-container-route
---

Check for referenced (`op is`) operations which have a `@route` on one of their containers.

#### ❌ Incorrect

```tsp
namespace Library {
  @route("/pets")
  interface Pets {
    @route("/read") read(): string;
  }
}

@service
namespace Service {
  interface PetStore {
    readPet is Library.Pets.read;
  }
}
```

#### ✅ Correct

```tsp
namespace Library {
  interface Pets {
    @route("/pets/read") read(): string;
  }
}

@service
namespace Service {
  interface PetStore {
    readPet is Library.Pets.read;
  }
}
```
