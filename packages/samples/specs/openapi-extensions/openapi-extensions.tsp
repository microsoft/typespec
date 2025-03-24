import "@typespec/rest";
import "@typespec/openapi";

using OpenAPI;

const MyConfig = #{ name: "Foo", age: 12, other: NestedConfig };
const NestedConfig = #{ id: "some" };

model Foo {
  @extension("x-string", "string")
  @extension("x-number", 123)
  @extension("x-bool", true)
  @extension("x-array", #["one", 2])
  @extension("x-obj", #{ foo: 123, bar: "string" })
  @extension("x-model", MyConfig)
  id: string;
}

op foo(): Foo;
