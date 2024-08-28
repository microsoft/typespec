import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;

@service({
  title: "HttpbinServer",
})
@server(
  "https://{domain}.{tld}{relative-path}",
  "Httpbin endpoint",
  {
    @doc("second-level domain, use httpbin")
    domain: string = "httpbin",

    @doc("top-level domain, use org")
    tld: string = "org",

    @doc("relative path segment, can be empty")
    `relative-path`?: string,
  }
)
namespace Cadl.Server {
  @Azure.ClientGenerator.Core.client({
    name: "HttpbinClient",
    service: Cadl.Server,
  })
  @route("/status/{code}")
  interface ServerOp {
    status(@path code: int32): OkResponse | NoContentResponse;
  }
}

@service({
  title: "ContosoServer",
})
@versioned(Cadl.ContosoServer.APIVersions)
@server(
  "{Endpoint}/contoso/{ApiVersion}",
  "Service endpoint",
  {
    @doc("Service endpoint")
    Endpoint: url,

    @doc("Api Version")
    @path
    ApiVersion: APIVersions,
  }
)
namespace Cadl.ContosoServer {
  enum APIVersions {
    v1: "v1",
  }

  @client({
    name: "Contoso.Sub.ContosoClient",
    service: Cadl.ContosoServer,
  })
  @route("/contoso/")
  interface ServerOp {
    get(@path(#{ allowReserved: true }) group: string): OkResponse | NoContentResponse;
  }
}
