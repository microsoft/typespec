import "@typespec/json-schema";

using JsonSchema;

@jsonSchema
namespace Schemas;

model Person {
  /** The person's first name. */
  firstName: string;

  /** The person's last name. */
  lastName: string;

  /** Age in years, which must be zero or greater. */
  @minValue(0)
  age: int32;

  /** The person's address. */
  address: Address;

  /** The person's nicknames. */
  @uniqueItems
  nickNames?: string[];

  /** Cars owned by the person. */
  cars?: Car[];
}

model Address {
  street: string;
  city: string;
  country: string;
}

model Car {
  kind: "ev" | "ice";
  brand: string;
  `model`: string;
}
