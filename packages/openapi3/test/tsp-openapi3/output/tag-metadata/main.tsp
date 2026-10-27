import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
@tagMetadata(#[
  #{
    name: "extensive",
    description: "An extensive operation",
    summary: "A summary of the extensive tag",
    kind: "OperationGroup",
  }
])
namespace title;

model Pet {
  name: string;
}

@tag("extensive")
@route("/")
@get
op extensive():
  | Pet
  | {
      @statusCode
      @minValue(400)
      @maxValue(499)
      statusCode: int32;
    }
  | {
      @statusCode
      @minValue(500)
      @maxValue(599)
      statusCode: int32;
    };
