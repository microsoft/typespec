import "@typespec/http";
import "@typespec/openapi";

import "../common/errors.tsp";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace OpenAI;

@route("/edits")
interface Edits {
  #deprecated "deprecated"
  @post
  @tag("OpenAI")
  @operationId("createEdit")
  create(@body edit: CreateEditRequest): CreateEditResponse | ErrorResponse;
}
