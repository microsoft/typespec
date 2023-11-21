---
title: "op-reference-container-route"
---

```text title="Id"
@typespec/http/op-reference-container-route
```

Check for referenced (`op is`) operations which have a `@route` on one of their containers.

When referencing an operation with `op is` only the data on the operation itself is carried over anything on parent container is lost.
This result in unexpected behavior where information is lost.
As a best practice the route should be provided on the operation itself.

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
