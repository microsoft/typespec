import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Sample data for testing
const samplePet = {
  kind: "pet",
  name: "Buddy",
  trained: true,
};

const sampleDog = {
  kind: "dog",
  name: "Rex",
  trained: true,
  breed: "German Shepherd",
};

// Animal operations

Scenarios.Azure_ClientGenerator_Core_HierarchyBuilding_AnimalOperations_updatePetAsAnimal =
  passOnSuccess({
    uri: "/azure/client-generator-core/hierarchy-building/pet/as-animal",
    method: "put",
    request: {
      body: json(samplePet),
    },
    response: {
      status: 200,
      body: json(samplePet),
    },
    kind: "MockApiDefinition",
  });

Scenarios.Azure_ClientGenerator_Core_HierarchyBuilding_AnimalOperations_updateDogAsAnimal =
  passOnSuccess({
    uri: "/azure/client-generator-core/hierarchy-building/dog/as-animal",
    method: "put",
    request: {
      body: json(sampleDog),
    },
    response: {
      status: 200,
      body: json(sampleDog),
    },
    kind: "MockApiDefinition",
  });

// Pet operations
Scenarios.Azure_ClientGenerator_Core_HierarchyBuilding_PetOperations_updatePetAsPet = passOnSuccess(
  {
    uri: "/azure/client-generator-core/hierarchy-building/pet/as-pet",
    method: "put",
    request: {
      body: json(samplePet),
    },
    response: {
      status: 200,
      body: json(samplePet),
    },
    kind: "MockApiDefinition",
  },
);

Scenarios.Azure_ClientGenerator_Core_HierarchyBuilding_PetOperations_updateDogAsPet = passOnSuccess(
  {
    uri: "/azure/client-generator-core/hierarchy-building/dog/as-pet",
    method: "put",
    request: {
      body: json(sampleDog),
    },
    response: {
      status: 200,
      body: json(sampleDog),
    },
    kind: "MockApiDefinition",
  },
);

// Dog operations
Scenarios.Azure_ClientGenerator_Core_HierarchyBuilding_DogOperations_updateDogAsDog = passOnSuccess(
  {
    uri: "/azure/client-generator-core/hierarchy-building/dog/as-dog",
    method: "put",
    request: {
      body: json(sampleDog),
    },
    response: {
      status: 200,
      body: json(sampleDog),
    },
    kind: "MockApiDefinition",
  },
);
