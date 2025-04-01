import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

export const expectedCreateBody = {
  name: "Madge",
  description: "desc",
  map: {
    key: {
      name: "InnerMadge",
      description: "innerDesc",
    },
  },
  array: [
    {
      name: "InnerMadge",
      description: "innerDesc",
    },
  ],
  intValue: 1,
  floatValue: 1.1,
  innerModel: {
    name: "InnerMadge",
    description: "innerDesc",
  },
  intArray: [1, 2, 3],
};

export const expectedUpdateBody = {
  description: null,
  map: {
    key: {
      description: null,
    },
    key2: null,
  },
  array: null,
  intValue: null,
  floatValue: null,
  innerModel: null,
  intArray: null,
};

Scenarios.Payload_JsonMergePatch_createResource = passOnSuccess({
  uri: "/json-merge-patch/create/resource",
  method: "put",
  request: {
    body: json(expectedCreateBody),
  },
  response: {
    status: 200,
    body: json(expectedCreateBody),
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_JsonMergePatch_updateResource = passOnSuccess({
  uri: "/json-merge-patch/update/resource",
  method: "patch",
  request: {
    body: json(expectedUpdateBody),
  },
  response: {
    status: 200,
    body: json({
      name: "Madge",
      map: {
        key: {
          name: "InnerMadge",
        },
      },
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_JsonMergePatch_updateOptionalResource = passOnSuccess({
  uri: "/json-merge-patch/update/resource/optional",
  method: "patch",
  request: {
    body: json(expectedUpdateBody),
  },
  response: {
    status: 200,
    body: json({
      name: "Madge",
      map: {
        key: {
          name: "InnerMadge",
        },
      },
    }),
  },
  kind: "MockApiDefinition",
});
