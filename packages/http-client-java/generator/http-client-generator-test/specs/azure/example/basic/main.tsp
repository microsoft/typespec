import "@typespec/http";
import "@typespec/rest";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Rest;
using Versioning;
using Spector;

/** Test for loading JSON example and generating sample code. */
@scenarioService(
  "/azure/example/basic",
  {
    versioned: Versions,
  }
)
@scenario
@scenarioDoc("""
  Expected request and response is same as the JSON example at examples/2022-12-01-preview/basic.json
  
  When generate the code, one need to set the "examples-dir" option.
  
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
namespace _Specs_.Azure.Example.Basic;

enum Versions {
  v2022_12_01_preview: "2022-12-01-preview",
}

model ApiVersionParameter {
  @query("api-version")
  @minLength(1)
  @doc("The API version to use for this operation.")
  apiVersion: string;
}

model ActionRequest {
  stringProperty: string;
  modelProperty?: Model;
  arrayProperty?: Array<string>;
  recordProperty?: Record<string>;
}

model Model {
  int32Property?: int32;
  float32Property?: float32;
  enumProperty?: Enum;
}

union Enum {
  string,
  "EnumValue1",
}

model ActionResponse is ActionRequest;

interface ServiceOperationGroup {
  #suppress "@typespec/spector/missing-scenario" "scenario defined in client.tsp"
  @route("/basic")
  @post
  basic(
    ...ApiVersionParameter,
    @query("query-param") queryParam: string,
    @header("header-param") headerParam: string,
    @body body: ActionRequest,
  ): ActionResponse;
}
