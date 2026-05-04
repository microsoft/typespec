import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

@discriminated(#{ envelope: "none", discriminatorPropertyName: "type" })
union CreateSpeechResponseStreamEvent {
  `speech.audio.delta`: SpeechAudioDeltaEvent,
  `speech.audio.done`: SpeechAudioDoneEvent,
}

model SpeechAudioDeltaEvent {
  type?: "speech.audio.delta";
  audio?: string;
}

model SpeechAudioDoneEvent {
  type?: "speech.audio.done";
}

@route("/") @get op extensive(): CreateSpeechResponseStreamEvent | {
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
