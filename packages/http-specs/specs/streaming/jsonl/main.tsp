import "@typespec/http";
import "@typespec/http/streams";
import "@typespec/spector";

using Http;
using Http.Streams;
using Spector;

@doc("Test of jsonl streaming.")
@scenarioService("/streaming/jsonl")
namespace Streaming.Jsonl;

@route("basic")
namespace Basic {
  @scenario
  @scenarioDoc("""
    Basic jsonl streaming for request.
    """)
  @route("send")
  @post
  op send(stream: JsonlStream<Info>): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Basic jsonl streaming for response.
    """)
  @route("receive")
  op receive(): JsonlStream<Info>;

  model Info {
    desc: string;
  }
}
