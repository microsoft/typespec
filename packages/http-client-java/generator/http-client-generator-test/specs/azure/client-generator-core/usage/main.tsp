import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;

@doc("Test for internal decorator.")
@scenarioService("/azure/client-generator-core/usage")
@global.Azure.ClientGenerator.Core.clientNamespace("azure.clientgenerator.core.usage", "java")
namespace _Specs_.Azure.ClientGenerator.Core.Usage;

@scenario
@scenarioDoc("""
  This scenario contains 4 public operations. All should be generated and exported.
  'OrphanModel' is not used but specified as 'public' and 'input', so it should be generated in SDK. The 'orphanModelSerializable' operation verifies that the model can be serialized to JSON.
  The other models' usage is additive to roundtrip, so they should be generated and exported as well.
  """)
@global.Azure.ClientGenerator.Core.clientNamespace("azure.clientgenerator.core.usage", "java")
namespace ModelInOperation {
  @doc("Usage additive to roundtrip.")
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
      "name": "Madge"
    }
    ```
    """)
  @route("/inputToInputOutput")
  @post
  op inputToInputOutput(@body body: InputModel): void;

  @doc("Usage additive to roundtrip.")
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
      "name": "Madge"
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
    @visibility(Lifecycle.Read)
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
        "name": "Madge"
      }
    }
    ```
    """)
  @route("/modelInReadOnlyProperty")
  @put
  op modelInReadOnlyProperty(@body body: RoundTripModel): {
    @body body: RoundTripModel;
  };

  @doc("""
    Serialize the 'OrphanModel' as request body.
    
    Expected body parameter:
    ```json
    {
      "name": "name",
      "desc": "desc"
    }
    ```
    """)
  @global.Azure.ClientGenerator.Core.convenientAPI(false)
  @route("/orphanModelSerializable")
  @put
  op orphanModelSerializable(@body body: unknown): NoContentResponse;
}

@doc("Not used anywhere, but access is override to public so still need to be generated and exported with serialization.")
@global.Azure.ClientGenerator.Core.usage(
  global.Azure.ClientGenerator.Core.Usage.input | global.Azure.ClientGenerator.Core.Usage.json
)
@global.Azure.ClientGenerator.Core.access(global.Azure.ClientGenerator.Core.Access.public)
model OrphanModel {
  @global.Azure.ClientGenerator.Core.clientName("modelName")
  name: string;

  @encodedName("application/json", "desc")
  description: string;
}
