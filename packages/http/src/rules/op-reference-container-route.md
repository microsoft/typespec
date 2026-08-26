When referencing an operation with `op is`, only the data on the operation itself is carried over; anything on the parent container is lost.
This results in unexpected behavior where information is lost.
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
