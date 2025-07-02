import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";
import "@typespec/versioning";

using TypeSpec.Http;
using global.Azure.ClientGenerator.Core;
using global.Azure.Core;
using TypeSpec.Versioning;
using Spector;

@scenarioService(
  "/azure/core/scalar",
  {
    versioned: Versions,
  }
)
@global.Azure.ClientGenerator.Core.clientNamespace("azure.core.scalar", "java")
namespace _Specs_.Azure.Core.Scalar;
@doc("The version of the API.")
enum Versions {
  @doc("The version 2022-12-01-preview.")
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_12_01_preview: "2022-12-01-preview",
}
model AzureLocationModel {
  location: azureLocation;
}

@operationGroup
@route("/azureLocation")
interface AzureLocationScalar {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a azureLocation value. Mock api will return 'eastus'")
  @get
  @doc("get azureLocation value")
  get(): {
    @header contentType: "application/json";
    @body body: azureLocation;
  };

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send a azureLocation value. Mock api expect to receive 'eastus'")
  @put
  @doc("put azureLocation value")
  put(@header contentType: "application/json", @body @doc("_") body: azureLocation): void;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("""
    Expect to send a model which has an azureLocation property.
    
    Expected request body:
    ```json
    {"location": "eastus"}
    ```
    
    Expected response body:
    ```json
    {"location": "eastus"}
    ```
    """)
  @scenarioDoc("Expect to send a model who has an azureLocation property. Mock api expect to receive '{location: eastus}'")
  @post
  @doc("post a model which has azureLocation property")
  post(
    @header contentType: "application/json",
    @body @doc("_") body: AzureLocationModel,
  ): AzureLocationModel;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("""
    Expect to send a azureLocation value as header.
    Expected header parameter: `region="eastus"`
    """)
  @post
  @route("/header")
  @doc("azureLocation value header")
  header(@header @doc("_") region: azureLocation): void;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("""
    Expect to send a azureLocation value as query.
    Expected query parameter: `region="eastus"`
    """)
  @post
  @doc("azureLocation value query")
  @route("/query")
  query(@query @doc("_") region: azureLocation): void;
}
