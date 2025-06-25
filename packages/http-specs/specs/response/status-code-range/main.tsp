import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for range of status code.
 */
@scenarioService("/response/status-code-range")
namespace Response.StatusCodeRange;

@scenario
@scenarioDoc("""
  Test case for range of status code in error response.
  
  Verify that the result of the API is an error/exception in client, and the error response can be de-serialized to ErrorInRange model (instead of DefaultError model).
  
  Expected status code 494 and response body:
  ```json
  { 
    "code": "request-header-too-large",
    "message": "Request header too large"
  }
  ```
  """)
@route("/error-response-status-code-in-range")
@get
op errorResponseStatusCodeInRange(): NoContentResponse | ErrorInRange | DefaultError;

@scenario
@scenarioDoc("""
  Test case for range of status code in error response.
  
  Verify that the result of the API is an error/exception in client, and the error response can be de-serialized to NotFoundError model (instead of Standard4XXError model).
  
  Expected status code 404 and response body:
  ```json
  { 
    "code": "not-found",
    "resourceId": "resource1"
  }
  ```
  """)
@route("/error-response-status-code-404")
@get
op errorResponseStatusCode404(): NoContentResponse | NotFoundError | Standard4XXError;

@error
model NotFoundError {
  @statusCode
  _: 404;

  code: string;
  resourceId: string;
}

@error
model ErrorInRange {
  @minValue(494)
  @maxValue(499)
  @statusCode
  _: int32;

  code: string;
  message: string;
}

@error
model Standard4XXError {
  @minValue(400)
  @maxValue(499)
  @statusCode
  _: int32;

  code: string;
}

@error
model DefaultError {
  code: string;
}
