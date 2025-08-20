import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test describing optional body payload behavior.")
@scenarioService("/payload/optional-body")
namespace Payload.OptionalBody;

model BodyModel {
  name: string;
}

@scenario
@scenarioDoc("""
  Test scenario for optional body payload where body is provided.
  
  Expected request body:
  ```json
  { "name": "foo" }
  ```
  
  Expected content-type header: application/json
  """)
@route("/set")
@post
op set(@body body?: BodyModel): NoContentResponse;

@scenario
@scenarioDoc("""
  Test scenario for optional body payload where body is omitted.
  
  Expected: no request body and no content-type header
  """)
@route("/omit")
@post
op omit(@body body?: BodyModel): NoContentResponse;