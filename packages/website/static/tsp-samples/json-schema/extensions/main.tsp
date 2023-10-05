import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
@extension(
  "x-tag",
  Json<{
    validate: true,
    category: "users",
  }>
)
model Person {
  /** The person's full name. */
  name: string;
}
