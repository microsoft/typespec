import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Test for internal decorator.")
@supportedBy("dpg")
@scenarioService("/azure/client-generator-core/usage")
namespace _Specs_.Azure.ClientGenerator.Core.Usage;

@scenario
@scenarioDoc("""
  This scenario contains two public operations. Both should be generated and exported.
  The models are override to roundtrip, so they should be generated and exported as well.
  """)
namespace ModelInOperation {
  @doc("Usage override to roundtrip.")
  @global.Azure.ClientGenerator.Core.usage(
    global.Azure.ClientGenerator.Core.Usage.input | global.Azure.ClientGenerator.Core.Usage.output
  )
  model InputModel {
    name: string;
  }

  @doc("""
    Expected body parameter: 
    ```json
    {
      "name": <any string>
    }
    ```
    """)
  @route("/inputToInputOutput")
  @post
  op inputToInputOutput(@body body: InputModel): void;

  @doc("Usage override to roundtrip.")
  @global.Azure.ClientGenerator.Core.usage(
    global.Azure.ClientGenerator.Core.Usage.input | global.Azure.ClientGenerator.Core.Usage.output
  )
  model OutputModel {
    name: string;
  }

  @doc("""
    Expected response body: 
    ```json
    {
      "name": <any string>
    }
    ```
    """)
  @route("/outputToInputOutput")
  @get
  op outputToInputOutput(): OutputModel;

  model ResultModel {
    name: string;
  }

  model RoundTripModel {
    @visibility("read")
    result: ResultModel;
  }

  @doc("""
    "ResultModel" should be usage=output, as it is read-only and does not exist in request body.
    
    Expected body parameter: 
    ```json
    {
    }
    ```
    
    Expected response body: 
    ```json
    {
      "result": {
        "name": <any string>
      }
    }
    ```
    """)
  @route("/modelInReadOnlyProperty")
  @put
  op modelInReadOnlyProperty(@body body: RoundTripModel): {
    @body body: RoundTripModel;
  };
}

@doc("Not used anywhere, but access is override to public so still need to be generated and exported with serialization.")
@global.Azure.ClientGenerator.Core.usage(global.Azure.ClientGenerator.Core.Usage.input)
@global.Azure.ClientGenerator.Core.access(global.Azure.ClientGenerator.Core.Access.public)
model OrphanModel {
  name: string;
}
