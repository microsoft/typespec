import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/authentication/oauth2")
@doc("Illustrates clients generated with OAuth2 authentication.")
@useAuth(OAuth2Auth<[MyFlow]>)
namespace Authentication.OAuth2;

model MyFlow {
  type: OAuth2FlowType.implicit;
  authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
  scopes: ["https://security.microsoft.com/.default"];
}

@scenario
@scenarioDoc("Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'")
@doc("Check whether client is authenticated")
@get
@route("/valid")
op valid(): NoContentResponse;

@scenario
@scenarioDoc("""
  Expect error code 400 and error body:
    ```json
    {
      "message": "Expected Bearer x but got Bearer y",
      "expected": "Bearer x",
      "actual": "Bearer y",
    }
    ```
  """)
@doc("Check whether client is authenticated. Will return an invalid bearer error.")
@get
@route("/invalid")
op invalid(): NoContentResponse | InvalidAuth;

@error
model InvalidAuth {
  @statusCode _: 403;
  error: string;
}
