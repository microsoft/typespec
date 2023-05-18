import "@typespec/json-schema";
import "./user.tsp";
import "./transaction.tsp";

using JsonSchema;

@jsonSchema
namespace Example;

model Person<T> {
  holding: T;
}

model Bus {
  person: Person<int32>;
}

namespace Sub {
  model Bus {}
}
