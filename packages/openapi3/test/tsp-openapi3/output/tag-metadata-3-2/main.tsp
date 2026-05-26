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
    parent: "root",
  }
])
namespace title;

model Pet {
  name: string;
}

@tag("extensive")
@route("/")
@get
op extensive(): Pet;
