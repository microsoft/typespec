import "@typespec/http";
import "@typespec/http/streams";
import "@typespec/spector";

using Http;
using Http.Streams;
using Spector;

@doc("Test of jsonl stream.")
@scenarioService("/stream/jsonl")
namespace Stream.Jsonl;

@scenario
@scenarioDoc("""
  Basic case of jsonl stream.
  """)
@route("basic")
namespace Basic {
  @route("send")
  @post
  op send(stream: JsonlStream<Info>): NoContentResponse;

  @route("receive")
  op receive(): JsonlStream<Info>;

  model Info {
    desc: string;
  }
}
