import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates inheritance with enum discriminator.")
@scenarioService("/type/model/inheritance/enum-discriminator")
namespace Type.Model.Inheritance.EnumDiscriminator;

@doc("extensible enum type for discriminator")
union DogKind {
  string,

  @doc("Species golden")
  Golden: "golden",
}

@doc("Test extensible enum type for discriminator")
@discriminator("kind")
model Dog {
  @doc("discriminator property")
  kind: DogKind;

  @doc("Weight of the dog")
  weight: int32;
}

@doc("Golden dog model")
model Golden extends Dog {
  @doc("discriminator property")
  kind: DogKind.Golden;
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing fixed enum as discriminator property"
@doc("fixed enum type for discriminator")
enum SnakeKind {
  @doc("Species cobra")
  Cobra: "cobra",
}

#suppress "@azure-tools/typespec-azure-core/no-fixed-enum-discriminator" "For testing fixed enum as discriminator property"
@doc("Test fixed enum type for discriminator")
@discriminator("kind")
model Snake {
  @doc("discriminator property")
  kind: SnakeKind;

  @doc("Length of the snake")
  length: int32;
}

@doc("Cobra model")
model Cobra extends Snake {
  @doc("discriminator property")
  kind: SnakeKind.Cobra;
}

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Receive model with extensible enum discriminator type.")
@scenario
@scenarioDoc("""
  Receive model with extensible enum discriminator type.
  Expected response body:
  ```json
  {"kind": "golden", "weight": 10}
  ```
  """)
@route("/extensible-enum")
@get
op getExtensibleModel(): Dog;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Send model with extensible enum discriminator type.")
@scenario
@scenarioDoc("""
  Send model with extensible enum discriminator type.
  Expected request body:
  ```json
  {"kind": "golden", "weight": 10}
  ```
  """)
@route("/extensible-enum")
@put
op putExtensibleModel(@body @doc("Dog to create") input: Dog): NoContentResponse;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Get a model omitting the discriminator.")
@scenario
@route("/extensible-enum/missingdiscriminator")
@scenarioDoc("""
  Get a model omitting the discriminator.
  Expected response body:
  ```json
  {"weight": 10}
  ```
  """)
@get
op getExtensibleModelMissingDiscriminator(): Dog;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Get a model containing discriminator value never defined.")
@scenario
@route("/extensible-enum/wrongdiscriminator")
@scenarioDoc("""
  Get a model containing discriminator value never defined.
  Expected response body:
  ```json
  {"weight": 8, "kind": "wrongKind" }
  ```
  """)
@get
op getExtensibleModelWrongDiscriminator(): Dog;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Receive model with fixed enum discriminator type.")
@scenario
@scenarioDoc("""
  Receive model with fixed enum discriminator type.
  Expected response body:
  ```json
  {"kind": "cobra", "length": 10}
  ```
  """)
@route("/fixed-enum")
@get
op getFixedModel(): Snake;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Send model with fixed enum discriminator type.")
@scenario
@scenarioDoc("""
  Send model with fixed enum discriminator type.
  Expected request body:
  ```json
  {"kind": "cobra", "length": 10}
  ```
  """)
@route("/fixed-enum")
@put
op putFixedModel(@body @doc("Snake to create") input: Snake): NoContentResponse;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Get a model omitting the discriminator.")
@scenario
@route("/fixed-enum/missingdiscriminator")
@scenarioDoc("""
  Get a model omitting the discriminator.
  Expected response body:
  ```json
  {"length": 10}
  ```
  """)
@get
op getFixedModelMissingDiscriminator(): Snake;

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing enum as discriminator property"
@doc("Get a model containing discriminator value never defined.")
@scenario
@route("/fixed-enum/wrongdiscriminator")
@scenarioDoc("""
  Get a model containing discriminator value never defined.
  Expected response body:
  ```json
  {"length": 8, "kind": "wrongKind" }
  ```
  """)
@get
op getFixedModelWrongDiscriminator(): Snake;
