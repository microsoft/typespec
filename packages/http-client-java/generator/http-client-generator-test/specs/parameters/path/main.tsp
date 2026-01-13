import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for path parameters cases.")
@scenarioService("/parameters/path")
namespace Parameters.Path;

@scenario
@scenarioDoc("""
  Test case for normal path parameter. 
  
  Should generate an operation like below:
  ```
  normal(name: string)
  ```
  
  Expected request path:
  ```
  /normal/foo
  ```
  """)
@route("/normal/{name}")
op normal(@path name: string): NoContentResponse;

@scenario
@scenarioDoc("""
  Test case for optional path parameter. 
  
  Should generate an operation like below:
  ```
  optional(name?: string)
  ```
  
  Expected two request:
  First request path:
  ```
  /optional
  ```
  Second request path:
  ```
  /optional/foo
  ```
  """)
@route("/optional{/name}")
op optional(@path name?: string): NoContentResponse;
