import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";
import "@typespec/versioning";

using TypeSpec.Http;
using global.Azure.ClientGenerator.Core;
using global.Azure.Core;
using TypeSpec.Versioning;

@scenarioService(
  "/azure/core/model",
  {
    versioned: Versions,
  }
)
namespace _Specs_.Azure.Core.Model;
@doc("The version of the API.")
enum Versions {
  @doc("The version 2022-12-01-preview.")
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_12_01_preview: "2022-12-01-preview",
}
model AzureEmbeddingModel {
  embedding: EmbeddingVector<int32>;
}

@operationGroup
@route("/embeddingVector")
interface AzureCoreEmbeddingVector {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle an embedding vector. Mock api will return [0, 1, 2, 3, 4]")
  @get
  @doc("get an embedding vector")
  get(): EmbeddingVector<int32>;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send an embedding vector. Mock api expect to receive [0, 1, 2, 3, 4]")
  @put
  @doc("put an embedding vector")
  put(@body @doc("_") body: EmbeddingVector<int32>): void;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("""
    Expect to send a model which has an embedding vector property.
    
    Expected request body:
    ```json
    {"embedding": [0, 1, 2, 3, 4]}
    ```
    
    Expected response body:
    ```json
    {"embedding": [5, 6, 7, 8, 9]}
    ```
    """)
  @post
  @doc("post a model which has an embeddingVector property")
  post(@body @doc("_") body: AzureEmbeddingModel): AzureEmbeddingModel;
}
