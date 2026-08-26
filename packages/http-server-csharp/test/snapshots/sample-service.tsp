// Sample TypeSpec service for snapshot testing.
// This exercises models, enums, inheritance, operations, and multiple interfaces.

@service(#{ title: "PetStore" })
namespace PetStore;

/** Address information */
model Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/** A pet in the store */
model Pet {
  id: int64;
  name: string;
  tag?: string;
  age?: int32;
  address?: Address;
}

/** A dog, extending Pet */
model Dog extends Pet {
  breed: string;
}

/** An error response */
@error
model Error {
  code: int32;
  message: string;
}

/** Result of listing pets */
model PetListResult {
  items: Pet[];
  nextLink?: string;
}

/** Color options for a pet */
enum Color {
  Red,
  Blue,
  Green,
}

/** Size categories */
enum Size {
  Small,
  Medium,
  Large,
}

/** Pet store operations */
interface Pets {
  /** List all pets */
  @route("/pets") @get list(@query skip?: int32, @query top?: int32): PetListResult | Error;

  /** Get a pet by ID */
  @route("/pets/{id}") @get read(@path id: int64): Pet | Error;

  /** Create a new pet */
  @route("/pets") @post create(@body body: Pet): Pet | Error;

  /** Update an existing pet */
  @route("/pets/{id}") @put update(@path id: int64, @body body: Pet): Pet | Error;

  /** Delete a pet */
  @route("/pets/{id}") @delete delete(@path id: int64): void | Error;
}

/** Dog-specific operations */
interface Dogs {
  /** List all dogs */
  @route("/dogs") @get list(): Dog[] | Error;

  /** Get a dog by ID */
  @route("/dogs/{id}") @get read(@path id: int64): Dog | Error;
}
