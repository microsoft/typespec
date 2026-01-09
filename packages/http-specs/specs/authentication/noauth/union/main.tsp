import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/authentication/noauth/union")
@doc("Illustrates clients generated with NoAuth and OAuth2 authentication union.")
@useAuth(NoAuth | OAuth2Auth<[MyFlow]>)
namespace Authentication.Noauth.Union;

model MyFlow {
  type: OAuth2FlowType.implicit;
  authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
  scopes: ["https://security.microsoft.com/.default"];
}

@scenario
@scenarioDoc("Expects no authentication. The server accepts requests without any authentication header.")
@doc("Check whether client can make a request without authentication")
@get
@route("/valid")
op validNoAuth(): NoContentResponse;

@scenario
@scenarioDoc("Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'")
@doc("Check whether client is authenticated with OAuth2 token")
@get
@route("/validtoken")
op validToken(): NoContentResponse;
