import "@typespec/http";
import "@typespec/http/streams";
import "@typespec/spector";

using TypeSpec.Http;
using TypeSpec.Http.Streams;
using Spector;

@doc("Test of jsonl streaming.")
@scenarioService("/streaming/jsonl")
namespace Streaming.Jsonl;

@route("as-binary")
namespace AsBinary {
  @scenario
  @scenarioDoc("""
    Jsonl streaming for request as binary.
    """)
  @route("send")
  @post
  op send(stream: JsonlStream<Info>): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Jsonl streaming for response as binary.
    """)
  @route("receive")
  op receive(): JsonlStream<Info>;

  model Info {
    desc: string;
  }
}
