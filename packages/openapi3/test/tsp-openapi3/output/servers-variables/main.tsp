import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
@server(
  "http://petstore.swagger.io/{version}",
  "The main API server",
  {
    @doc("The API version")
    version: "v1" | "v2" = "v1",
  }
)
namespace title;

model Pet {
  name: string;
}

@tag("extensive")
@route("/")
@get
op extensive(): Pet | {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
} | {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
};
