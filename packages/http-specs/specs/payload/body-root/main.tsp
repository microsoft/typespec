import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/body-root")
@doc("Test cases for @bodyRoot decorator.")
namespace Payload.BodyRoot;

// Input only request model
model InputRequest {
  @path name: string;
  age: int32;
  gender: string;
  @header("x-client-id") clientId: string;
}

// Test case for using @bodyRoot with a header and a query parameter with input only request
@scenario
@scenarioDoc("""
  Test case for using @bodyRoot with a header and a path parameter for input only request.
  
  Should generate method as typespec defines.
  Should not generate separated path/header parameters.
  Should generate an method like below:
  ```
  inputOnly(option: InputRequest);
  ```
  Please note the parameter name is devired from the model name and it may vary by language. 
  
  
  Expected request path:
  /input-only/alice
  
  Expected request body:
  ```json
  {
    "age": 30,
    "gender": "female", 
  }
  ```
  Expected request header:
  `x-client-id: 123`
  """)
@post
@route("/input-only")
op inputOnly(@bodyRoot option: InputRequest): NoContentResponse;

// Input and output request model
model RoundTripModel {
  @path name: string;
  age: int32;
  gender: string;
  @header("x-client-id") clientId: string;
}

// Test case for using @bodyRoot with a header and a path parameter for input and output request
@scenario
@scenarioDoc("""
  Test case for using @bodyRoot with a header and a path parameter for input and output request.
  
  Try to generate method as typespec defines.
  Should not generate separated path/header parameters.
  Should generate an method like below:
  ```
  inputAndOutput(option: RoundTripModel): RoundTripModel;
  ```
  Please note the parameter name is devired from the model name and it may vary by language. 
  Please also note some languages may split models into multiple parameters.
  
  Expected request path:
  /input-and-output/alice
  
  Expected request body:  
  ```json
  {
    "age": 30,
    "gender": "female", 
  }
  ```
  
  Expected request header:
  `x-client-id: 123`
  
  
  Expected response body:
  ```json
  {
    "name": "alice",
    "age": 30,
    "gender": "female",
  }
  ```
  
  Expected response header:
  `x-client-id: 123`
  """)
@post
@route("/input-and-output")
op inputAndOutput(@bodyRoot option: RoundTripModel): RoundTripModel;

// Output only response model
model OutputResponse {
  @path
  name: string;

  age: int32;
  gender: string;
  @header("x-client-id") clientId: string;
}

// Test case for using @bodyRoot with a header and a path parameter for output only response
@scenario
@scenarioDoc("""
  Test case for using @bodyRoot with a header and a path parameter for output only response.
  
  Should generate method as typespec defines.
  Should not generate separated path/header parameters.
  Should generate an method like below:
  ```
  outputOnly(name: string): OutputResponse;
  ```
  Please note the parameter name is devired from the model name and it may vary by language. 
  
  
  Expected request path:
  /output-only/alice
  
  Expected response body:
  ```json
  {
    "name": "alice",
    "age": 30,
    "gender": "female",
  }
  ```
  
  Expected response header:
  `x-client-id: 123`
  """)
@get
@route("/output-only")
op outputOnly(@path name: string): OutputResponse;

// Optional query parameters request model
model OptionalParamRequest {
  @path name: string;
  @query orderby?: string;
  @header("x-client-id") clientId?: string;
}

// Test case for using @bodyRoot with optional parameters
@scenario
@scenarioDoc("""
  Test case for using @bodyRoot with optional parameters.
  
  Should generate method as typespec defines.
  Should not generate separated path/header/query parameters.
  Should generate an method like below:
  ```
  optionalParam(option: OptionalParamRequest): string[];
  ```
  Please note the parameter name is devired from the model name and it may vary by language. 
  
  Expected request path:
  /optional-query/alice
  
  Expected request query:
  `orderby=asc`
  
  Expected request header:
  `x-client-id: 123`
  
  Expected response body:
  ```json
  ["cat", "dog"]
  ```
  
  """)
@get
@route("/optional-param")
op optionalParam(@bodyRoot option: OptionalParamRequest): string[];
