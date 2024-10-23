import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "Parameter Decorators",
})
@info({
  version: "0.0.0",
})
namespace ParameterDecorators;

model Thing {
  name: string;
  @format("UUID") id: string;
}

/**
 * The request has succeeded.
 */
model Operations_getThing200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Thing;
}

/**
 * The request has succeeded.
 */
model Operations_putThing200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Thing;
}

@route("/thing/{name}") @get op Operations_getThing(
  @pattern("^[a-zA-Z0-9-]{3,24}$")
  @format("UUID")
  @path
  name: string,

  @minValue(0)
  @maxValue(10)
  @query
  count: int32,
): Operations_getThing200ApplicationJsonResponse;

@route("/thing/{name}") @put op Operations_putThing(
  ...Parameters.NameParameter,
  @bodyRoot body: Thing,
): Operations_putThing200ApplicationJsonResponse;

namespace Parameters {
  model NameParameter {
    /**
     * Name parameter
     */
    @pattern("^[a-zA-Z0-9-]{3,24}$")
    @format("UUID")
    @path
    name: string;
  }
}
