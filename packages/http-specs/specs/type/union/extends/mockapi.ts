import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const pets = [
  {
    name: "mittens",
    toy: "ball",
  },
  {
    name: "rex",
    food: "bones",
  },
];

const multiple = {
  byName: [
    {
      name: "mittens",
      food: "fish",
      toy: "ball",
    },
    {
      name: "rex",
      food: "bones",
      bark: true,
    },
  ],
  byFood: [
    {
      name: "mittens",
      food: "fish",
      toy: "ball",
    },
    {
      name: "rex",
      food: "bones",
      bark: true,
    },
  ],
};

Scenarios.Type_Union_Extends_Structural_roundTrip = passOnSuccess({
  uri: "/type/union/extends/structural",
  method: "put",
  request: {
    body: json(pets),
  },
  response: {
    status: 200,
    body: json(pets),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Extends_Explicit_roundTrip = passOnSuccess({
  uri: "/type/union/extends/explicit",
  method: "put",
  request: {
    body: json(pets),
  },
  response: {
    status: 200,
    body: json(pets),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Union_Extends_Multiple_roundTrip = passOnSuccess({
  uri: "/type/union/extends/multiple",
  method: "put",
  request: {
    body: json(multiple),
  },
  response: {
    status: 200,
    body: json(multiple),
  },
  kind: "MockApiDefinition",
});
