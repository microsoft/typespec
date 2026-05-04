import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Parameter Decorators" })
@info(#{ version: "0.0.0" })
namespace ParameterDecorators;

model Thing {
  name: string;
  @format("UUID") id: string;
}

@route("/thing/{name}") @get op Operations_getThing(
  @pattern("^[a-zA-Z0-9-]{3,24}$")
  @format("UUID")
  @path
  name: string,

  @minValue(0)
  @maxValue(10)
  @query(#{ explode: true })
  count: int32,
): Thing;

@route("/thing/{name}") @put op Operations_putThing(
  ...Parameters.NameParameter,
  @body body: Thing,
): Thing;

namespace Parameters {
  model NameParameter {
    /** Name parameter */
    @pattern("^[a-zA-Z0-9-]{3,24}$")
    @format("UUID")
    @path
    name: string;
  }
}
