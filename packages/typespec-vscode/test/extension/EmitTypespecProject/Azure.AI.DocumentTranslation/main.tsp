import "@typespec/rest";
import "@typespec/http";
import "./routes.tsp";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;

@service(#{ title: "Azure.AI.DocumentTranslation" })
@versioned(DocumentTranslation.Versions)
@useAuth(
  ApiKeyAuth<ApiKeyLocation.header, "Ocp-Apim-Subscription-Key"> | OAuth2Auth<[
    {
      type: OAuth2FlowType.authorizationCode,
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/token",
      scopes: ["https://cognitiveservices.azure.com/.default"],
    }
  ]>
)
@server(
  "{endpoint}/translator",
  "Document translation service endpoint",
  {
    @doc("Supported document Translation endpoint, protocol and hostname, for example: https://{TranslatorResourceName}.cognitiveservices.azure.com/translator.")
    endpoint: url,
  }
)
@doc("Document translation service")
namespace DocumentTranslation;

#suppress "@azure-tools/typespec-azure-core/documentation-required" "https://github.com/Azure/typespec-azure/issues/3107"
@doc("Document Translation supported versions")
enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  v2024_05_01: "2024-05-01",

  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  v2024_11_01_preview: "2024-11-01-preview",
}
