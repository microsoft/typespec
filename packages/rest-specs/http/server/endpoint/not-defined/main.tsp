import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";

using TypeSpec.Http;

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
