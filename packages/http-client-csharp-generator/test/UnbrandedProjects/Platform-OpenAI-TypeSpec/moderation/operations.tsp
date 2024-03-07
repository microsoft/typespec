import "@typespec/http";
import "@typespec/openapi";

import "../common/errors.tsp";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace OpenAI;

@route("/moderations")
interface Moderations {
  @operationId("createModeration")
  @tag("OpenAI")
  @summary("Classifies if text violates OpenAI's Content Policy")
  create(
    @body content: CreateModerationRequest,
  ): CreateModerationResponse | ErrorResponse;
}
