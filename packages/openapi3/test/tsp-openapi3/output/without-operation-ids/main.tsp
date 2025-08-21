import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

model PetOwner {
  name?: string;
}

@route("/") @get op GetRoot(): PetOwner | {
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
