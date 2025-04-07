import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

@service(#{ title: "Sample TypeSpec Project", version: "0.1.0" })
@doc("This is a sample TypeSpec project.")
@server(
  "{sampleTypeSpecUrl}",
  "Endpoint Service",
  {
    sampleTypeSpecUrl: string,
  }
)
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "my-api-key">)
namespace SampleService;

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

/** Sample Widget */
model Widget {
  name: string;
  id: string;
  type: string;
  weight: float32;
}

@route("/getWidget/{id}")
@doc("head as boolean.")
@convenientAPI(true)
op getWidget(@path id: string): Widget;
