import "@typespec/http";
import "@typespec/spector";

using TypeSpec.Http;
using Spector;

@scenarioService("/authentication/http/custom")
@doc("Illustrates clients generated with generic HTTP auth.")
@useAuth({
  type: AuthType.http,
  scheme: "SharedAccessKey",
})
namespace Authentication.Http.Custom;

@scenario
@scenarioDoc("Expects header 'Authorization': 'SharedAccessKey valid-key'")
@doc("Check whether client is authenticated")
@get
@route("/valid")
op valid(): NoContentResponse;

@scenario
@scenarioDoc("""
  Expect error code 403 and error body:
    ```json
    {
      "error": "invalid-api-key"
    }
    ```
  """)
@doc("Check whether client is authenticated.")
@get
@route("/invalid")
op invalid(): NoContentResponse | InvalidAuth;

@error
model InvalidAuth {
  @statusCode _: 403;
  error: string;
}
