import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Test for basic parameters cases.")
@supportedBy("dpg")
@scenarioService("/parameters/basic")
namespace Parameters.Basic;

@route("/explicit-body")
@operationGroup
namespace ExplicitBody {
  @doc("This is a simple model.")
  model User {
    name: string;
  }

  @scenario
  @scenarioDoc("""
    Test case for simple explicit body. 
    
    Should generate request body model named `User`.
    Should generate an operation like below:
    ```
    spreadAsRequestBody(bodyParameter: BodyParameter)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/simple")
  @put
  op simple(@body body: User): NoContentResponse;
}

@route("/implicit-body")
@operationGroup
namespace ImplicitBody {
  @scenario
  @scenarioDoc("""
    Test case for simple implicit body. 
    
    Should generate an operation like below:
    ```
    simple(name: string)
    ```
    
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/simple")
  @put
  op simple(name: string): NoContentResponse;
}
