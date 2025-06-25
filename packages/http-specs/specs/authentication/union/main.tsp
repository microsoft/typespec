import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/authentication/union")
@doc("Illustrates clients generated with ApiKey and OAuth2 authentication.")
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key"> | OAuth2Auth<[MyFlow]>)
namespace Authentication.Union;

model MyFlow {
  type: OAuth2FlowType.implicit;
  authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
  scopes: ["https://security.microsoft.com/.default"];
}

@scenario
@scenarioDoc("Expects header 'x-ms-api-key': 'valid-key'")
@doc("Check whether client is authenticated")
@get
@route("/validkey")
op validKey(): NoContentResponse;

@scenario
@scenarioDoc("Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'")
@doc("Check whether client is authenticated")
@get
@route("/validtoken")
op validToken(): NoContentResponse;
