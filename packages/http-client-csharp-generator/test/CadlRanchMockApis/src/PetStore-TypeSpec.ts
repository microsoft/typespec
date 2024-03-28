import { passOnSuccess, ScenarioMockApi, mockapi, json, MockApi } from "@azure-tools/cadl-ranch-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const dog = {
  name: "dog",
  age: 12,
};

Scenarios.PetStore_DeletePetById = passOnSuccess(
  mockapi.delete("/pets/1", () => {
    return {
      status: 200,
    };
  }),
);

Scenarios.PetStore_ReadPetById = passOnSuccess(
  mockapi.get("/pets/1", () => {
    return {
      status: 200,
      body: json(dog),
    };
  }),
);

Scenarios.PetStore_CreatePet = passOnSuccess(
  mockapi.post("/pets", (req) => {
    req.expect.bodyEquals(dog);
    return {
      status: 200,
      body: json(dog),
    };
  }),
);

Scenarios.PetStore_GetPetByKind = passOnSuccess(
  mockapi.get("/pets/dog", () => {
    return {
      status: 200,
      body: json(dog),
    };
  }),
);

Scenarios.PetStore_GetFirstPet = passOnSuccess(
  mockapi.get("/pets", (req) => {
    req.expect.containsQueryParam("start", "1");
    return {
      status: 200,
      body: json(dog),
    };
  }),
);

Scenarios.PetStore_GetFish = passOnSuccess(
  mockapi.get("/pets/getFish", (req) => {
    req.expect.containsQueryParam("kind", "shark");
    return {
      status: 200,
      body: json({
        kind: "shark",
        size: 100,
        bite: "I can bite"
      }),
    };
  }),
);
