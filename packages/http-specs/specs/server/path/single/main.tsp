import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates server with a single path parameter @server")
@service
@server(
  "{endpoint}",
  "Testserver endpoint",
  {
    @doc("Need to be set as 'http://localhost:3000' in client.")
    endpoint: url,
  }
)
@route("/server/path/single")
namespace Server.Path.Single;

@scenario
@scenarioDoc("An simple operation in a parameterized server.")
@route("/myOp")
@head
op myOp(): OkResponse;
