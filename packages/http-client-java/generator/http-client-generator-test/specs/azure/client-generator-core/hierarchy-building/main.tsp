import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Azure.ClientGenerator.Core;

@doc("Test for @hierarchyBuilding decorator.")
@scenarioService("/azure/client-generator-core/hierarchy-building")
@global.Azure.ClientGenerator.Core.clientNamespace(
  "specs.azure.clientgenerator.core.hierarchybuilding",
  "python"
)
@global.Azure.ClientGenerator.Core.clientNamespace(
  "azure.clientgenerator.core.hierarchybuilding",
  "java"
)
namespace _Specs_.Azure.ClientGenerator.Core.HierarchyBuilding;

@discriminator("kind")
model Animal {
  @doc("The kind of animal")
  kind: string;

  @doc("Name of the animal")
  name: string;
}

alias PetContent = {
  @doc("Whether the pet is trained")
  trained: boolean;
};

model Pet extends Animal {
  kind: "pet";
  ...PetContent;
}

alias DogContent = {
  @doc("The breed of the dog")
  breed: string;
};

@global.Azure.ClientGenerator.Core.Legacy.hierarchyBuilding(Pet)
model Dog extends Animal {
  kind: "dog";
  ...PetContent;
  ...DogContent;
}

interface AnimalOperations {
  @scenario
  @route("/pet/as-animal")
  @scenarioDoc("""
    Test operation that accepts Animal input and returns Animal output.
    Service expects Pet data and returns Pet data.
    Expected request body:
    ```json
    {
      "kind": "pet",
      "name": "Buddy",
      "trained": true
    }
    ```
    Expected response body:
    ```json
    {
      "kind": "pet",
      "name": "Buddy", 
      "trained": true
    }
    ```
    """)
  @doc("Update a pet as an animal")
  @put
  updatePetAsAnimal(@body animal: Animal): Animal;

  @scenario
  @route("/dog/as-animal")
  @scenarioDoc("""
    Test operation that accepts Animal input and returns Animal output.
    Service expects Dog data and returns Dog data.
    Due to @hierarchyBuilding(Pet), Dog should inherit from Pet rather than Animal directly.
    Expected request body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    Expected response body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    """)
  @doc("Update a dog as an animal")
  @put
  updateDogAsAnimal(@body animal: Animal): Animal;
}

interface PetOperations {
  @scenario
  @route("/pet/as-pet")
  @scenarioDoc("""
    Test operation that accepts Pet input and returns Pet output.
    This operation validates Pet type directly.
    Expected request body:
    ```json
    {
      "kind": "pet",
      "name": "Buddy",
      "trained": true
    }
    ```
    Expected response body:
    ```json
    {
      "kind": "pet",
      "name": "Buddy",
      "trained": true
    }
    ```
    """)
  @doc("Update a pet as a pet")
  @put
  updatePetAsPet(@body pet: Pet): Pet;

  @scenario
  @route("/dog/as-pet")
  @scenarioDoc("""
    Test operation that accepts Pet input and returns Pet output.
    Service expects Dog data and returns Dog data.
    This validates that Dog can be used as Pet due to @hierarchyBuilding decorator.
    Expected request body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    Expected response body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    """)
  @doc("Update a dog as a pet")
  @put
  updateDogAsPet(@body pet: Pet): Pet;
}

interface DogOperations {
  @scenario
  @route("/dog/as-dog")
  @scenarioDoc("""
    Test operation that accepts Dog input and returns Dog output.
    This operation validates Dog type directly.
    Expected request body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    Expected response body:
    ```json
    {
      "kind": "dog",
      "name": "Rex",
      "trained": true,
      "breed": "German Shepherd"
    }
    ```
    """)
  @doc("Update a dog as a dog")
  @put
  updateDogAsDog(@body dog: Dog): Dog;
}
