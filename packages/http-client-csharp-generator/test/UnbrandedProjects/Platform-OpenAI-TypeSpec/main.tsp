import "@typespec/http";
import "@typespec/openapi3";
import "@typespec/openapi";

import "./audio";
import "./completions";
import "./edits";
import "./embeddings";
import "./files";
import "./fine-tuning";
import "./images";
import "./moderation";

using TypeSpec.Http;

/** The OpenAI REST API. Please see https://platform.openai.com/docs/api-reference for more details. */
@service({
  title: "OpenAI API",
  termsOfService: "https://openai.com/policies/terms-of-use",
  contact: {
    name: "OpenAI Support",
    url: "https://help.openai.com",
  },
  license: {
    name: "MIT",
    url: "https://github.com/openai/openai-openapi/blob/master/LICENSE",
  },
  version: "2.0.0",
})
@server("https://api.openai.com/v1", "OpenAI Endpoint")
@useAuth(BearerAuth)
namespace OpenAI;
