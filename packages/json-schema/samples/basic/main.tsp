import "@typespec/json-schema";

using JsonSchema;

@JsonSchema
namespace Example;

@multipleOf(10)
scalar ipv4 extends int32;
