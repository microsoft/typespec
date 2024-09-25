import "@azure-tools/typespec-client-generator-core";

import "./main.tsp";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@TypeSpec.Versioning.useDependency(_Specs_.Azure.Example.Basic.Versions.v2022_12_01_preview)
@route("/azure/example/basic")
namespace Client;

@client({
  name: "AzureExampleClient",
  service: _Specs_.Azure.Example.Basic,
})
interface AzureExampleClient {
  @scenario
  @scenarioDoc("""
    Expected request and response is same as the JSON example at examples/2022-12-01-preview/basic.json
    
    When generate the code, one need to set the "examples-directory" option.
    
    Expected query parameter: query-param=query&api-version=2022-12-01-preview
    Expected header parameter: header-param=header
    
    Expected input body:
    ```json
    {
      "stringProperty": "text",
      "modelProperty": {
        "int32Property": 1,
        "float32Property": 1.5,
        "enumProperty": "EnumValue1"
      },
      "arrayProperty": [
        "item"
      ],
      "recordProperty": {
        "record": "value"
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "stringProperty": "text"
    }
    ```
    """)
  basicAction is _Specs_.Azure.Example.Basic.ServiceOperationGroup.basic;
}
