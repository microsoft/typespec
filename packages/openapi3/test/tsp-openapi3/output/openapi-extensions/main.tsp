import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "(title)",
})
@info({
  version: "0.0.0",
})
namespace title;

model Foo {
  @extension(
    "x-model",
    {
      name: "Foo",
      age: 12,
      other: {
        id: "some",
      },
    }
  )
  @extension(
    "x-obj",
    {
      foo: 123,
      bar: "string",
    }
  )
  @extension("x-array", ["one", 2])
  @extension("x-bool", true)
  @extension("x-number", 123)
  @extension("x-string", "string")
  id: string;
}

model MyConfig {
  name: "Foo";
  age: 12;
  other: NestedConfig;
}

model NestedConfig {
  id: "some";
}

/**
 * The request has succeeded.
 */
model foo200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Foo;
}

@route("/") @get op foo(): foo200ApplicationJsonResponse;
