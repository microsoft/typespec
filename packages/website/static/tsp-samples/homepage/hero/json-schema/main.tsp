import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Schemas;

model Person {
  name: string;
  address: Address;
  @uniqueItems nickNames?: string[];
  cars?: Car[];
}

/** Respresent an address */
model Address {
  street: string;
  city: string;
  country: string;
}

model Car {
  kind: "ev" | "ice";
  brand: string;
  @minValue(1900) year: int32;
}
