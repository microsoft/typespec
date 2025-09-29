import "@typespec/rest";
import "@typespec/versioning";
import "./routes.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service(#{ title: "Azure Batch" })
@versioned(Azure.Batch.Versions)
@doc("Azure Batch provides Cloud-scale job scheduling and compute management.")
@server(
  "{endpoint}",
  "Azure Batch provides Cloud-scale job scheduling and compute management.",
  {
    @doc("Batch account endpoint (for example: https://batchaccount.eastus2.batch.azure.com).")
    endpoint: url,
  }
)
@useAuth(
  OAuth2Auth<[
    {
      type: OAuth2FlowType.implicit,
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      scopes: ["https://batch.core.windows.net//.default"],
    }
  ]>
)
namespace Azure.Batch;

@doc("The Azure Batch service version.")
enum Versions {
  @doc("API Version 2024-07-01.20.0")
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  v2024_07_01: "2024-07-01.20.0",
}
