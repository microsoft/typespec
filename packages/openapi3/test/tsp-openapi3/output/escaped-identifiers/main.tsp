import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "Sample API",
})
@info({
  version: "1.0.0",
})
namespace SampleAPI;

scalar `Foo-Bar` extends string;

model `Escaped-Model` {
  id: string;
  `escaped-property`?: string;
}

/**
 * Success
 */
@defaultResponse
model `get-thingDefaultResponse` {}

@route("/{escaped-property}") @get op `get-thing`(
  @query `weird@param`?: `Foo-Bar`,
  ...Parameters.`Escaped-Model`.`escaped-property`,
  @bodyRoot body: `Escaped-Model`,
): `get-thingDefaultResponse`;

namespace Parameters {
  namespace `Escaped-Model` {
    model `escaped-property` {
      @path `escaped-property`: string;
    }
  }
}
