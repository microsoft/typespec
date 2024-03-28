import "@typespec/http";
import "@typespec/openapi";

import "../common/errors.tsp";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace OpenAI;

@route("/embeddings")
interface Embeddings {
  @tag("OpenAI")
  @summary("Creates an embedding vector representing the input text.")
  @post
  @operationId("createEmbedding")
  create(
    @body embedding: CreateEmbeddingRequest,
  ): CreateEmbeddingResponse | ErrorResponse;
}
