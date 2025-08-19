import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test describing optionality of the request body.")
@scenarioService("/parameters/body-optionality")
namespace Parameters.BodyOptionality;

model BodyModel {
  name: string;
}

@scenario
@scenarioDoc("""
  Scenario defining how an explicit required body parameter is specified.
  
  Expected request body:
  ```json
  { "name": "foo" }
  ```
  """)
@route("/required-explicit")
@post
op requiredExplicit(@body body: BodyModel): NoContentResponse;

@scenario
@scenarioDoc("""
  Scenario defining how an explicit optional body parameter is specified.
  
  Expected request body for `set`
  ```json
  { "name": "foo" }
  ```
  
  Expected no request body for `omit`
  """)
@route("/optional-explicit")
namespace OptionalExplicit {
  @route("/set")
  @post
  op set(@body body?: BodyModel): NoContentResponse;

  @route("/omit")
  @post
  op omit(@body body?: BodyModel): NoContentResponse;
}

@scenario
@scenarioDoc("""
  Scenario defining how an implicit required body parameter is specified.
    
  Expected request body:
  ```json
  { "name": "foo" }
  ```
  """)
@route("/required-implicit")
@post
op requiredImplicit(...BodyModel): NoContentResponse;

@scenario
@scenarioDoc("""
  Scenario testing Content-Type header presence/absence for optional body.
  
  For `setContentType`: body is provided, Content-Type header must be present
  Expected request body:
  ```json
  { "name": "foo" }
  ```
  Expected header: Content-Type: application/json
  
  For `omitContentType`: body is not provided, Content-Type header must NOT be present
  Expected: no request body and no Content-Type header
  """)
@route("/content-type")
namespace ContentTypeHeader {
  @route("/set")
  @post
  op setContentType(@body body?: BodyModel): NoContentResponse;

  @route("/omit")
  @post
  op omitContentType(@body body?: BodyModel): NoContentResponse;
}
