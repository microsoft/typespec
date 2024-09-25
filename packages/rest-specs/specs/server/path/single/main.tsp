import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";

using TypeSpec.Http;

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
