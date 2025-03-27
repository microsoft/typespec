import "@typespec/rest";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using Versioning;
using Rest;

@versioned(Versions)
@service(#{ title: "ServerPathMultiple" })
@server(
  "{endpoint}/server/path/multiple/{apiVersion}",
  "Test server with path parameters.",
  {
    @doc("Pass in http://localhost:3000 for endpoint.")
    endpoint: url,

    @doc("Pass in v1.0 for API version.")
    apiVersion: Versions,
  }
)
namespace Server.Path.Multiple;

@doc("Service versions")
enum Versions {
  @doc("Version 1.0")
  v1_0: "v1.0",
}

@scenario
@scenarioDoc("""
  Operation with client path parameters.
  
  Expected path parameter: apiVersion=v1.0
  """)
op noOperationParams(): NoContentResponse;

@scenario
@scenarioDoc("""
  Operation with client and method path parameters.
  
  Expected path parameter: apiVersion=v1.0, keyword=test
  """)
op withOperationPathParam(@path keyword: string): NoContentResponse;
