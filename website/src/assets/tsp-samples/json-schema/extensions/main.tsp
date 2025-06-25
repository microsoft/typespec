import "@typespec/json-schema";

using JsonSchema;

@jsonSchema
@extension(
  "x-tag",
  Json<{
    validate: true,
    category: "users",
  }>
)
model Server {
  @format("hostname")
  hostname: string;
}
