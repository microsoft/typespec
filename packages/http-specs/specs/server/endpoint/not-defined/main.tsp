import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Illustrates server doesn't define endpoint. Client should automatically add an endpoint to let user pass in.
 */
@route("/server/endpoint/not-defined")
@service({
  title: "Testserver without any endpoint",
})
namespace Server.Endpoint.NotDefined;

@scenario
@scenarioDoc("A simple operation in a server without defining a endpoint. Expected uri: '<endpoint you start cadl-ranch>/valid'")
@route("/valid")
@head
op valid(): OkResponse;
