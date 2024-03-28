import "@typespec/http";
import "@typespec/openapi";

import "../common/errors.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace OpenAI;
@route("/audio")
namespace Audio {
  @route("transcriptions")
  interface Transcriptions {
    @post
    @operationId("createTranscription")
    @tag("OpenAI")
    @summary("Transcribes audio into the input language.")
    create(
      @header contentType: "multipart/form-data",
      @body audio: CreateTranscriptionRequest,
    ): CreateTranscriptionResponse | ErrorResponse;
  }

  @route("translations")
  interface Translations {
    @post
    @operationId("createTranslation")
    @tag("OpenAI")
    @summary("Transcribes audio into the input language.")
    create(
      @header contentType: "multipart/form-data",
      @body audio: CreateTranslationRequest,
    ): CreateTranslationResponse | ErrorResponse;
  }
}
