import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/authentication/api-key")
@doc("Illustrates clients generated with ApiKey authentication.")
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
namespace Authentication.ApiKey;

@scenario
@scenarioDoc("Expects header 'x-ms-api-key': 'valid-key'")
@doc("Check whether client is authenticated")
@get
@route("/valid")
op valid(): NoContentResponse;

@scenario
@scenarioDoc("""
  Expect error code 403 and error body:
    ```json
    {
      "error": {
        "code": "InvalidApiKey",
        "message": "API key is invalid"
      }
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
