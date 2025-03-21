import "@typespec/json-schema";

using JsonSchema;

@jsonSchema
namespace Schemas;

model Person {
  /** The person's full name. */
  name: string;

  /** Person address */
  address: Address;

  /** List of nick names */
  @uniqueItems nickNames?: string[];

  /** List of cars person owns */
  cars?: Car[];
}

/** Respresent an address */
model Address {
  street: string;
  city: string;
  country: string;
}

model Car {
  /** Kind of car */
  kind: "ev" | "ice";

  /** Brand of the car */
  brand: string;

  /** Year the car was manufactured. */
  @minValue(1900) year: int32;
}
