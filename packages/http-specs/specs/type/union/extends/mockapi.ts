import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = {
  structural: [
    {
      name: "mittens",
      toy: "ball",
    },
    {
      name: "rex",
      food: "bones",
    },
  ],
  explicit: [
    {
      name: "mittens",
      toy: "ball",
    },
    {
      name: "rex",
      food: "bones",
    },
  ],
  multipleByName: [
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
  multipleByFood: [
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

Scenarios.Type_Union_Extends_roundTrip = passOnSuccess({
  uri: "/type/union/extends/",
  method: "put",
  request: {
    body: json(body),
  },
  response: {
    status: 200,
    body: json(body),
  },
  kind: "MockApiDefinition",
});
