import { json, mockapi, MockApi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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
  name: "Madge",
  description: null,
  map: {
    key: {
      name: "InnerMadge",
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

function createMockApis(route: string, isUpdateRequest: boolean): MockApi {
  const url = `/json-merge-patch/${route}`;

  if (isUpdateRequest) {
    return mockapi.patch(url, (req) => {
      req.expect.deepEqual(req.body.description, expectedUpdateBody.description);
      req.expect.deepEqual(req.body.map.key.description, expectedUpdateBody.map.key.description);
      req.expect.deepEqual(req.body.map.key2, expectedUpdateBody.map.key2);
      req.expect.deepEqual(req.body.array, expectedUpdateBody.array);
      req.expect.deepEqual(req.body.intValue, expectedUpdateBody.intValue);
      req.expect.deepEqual(req.body.floatValue, expectedUpdateBody.floatValue);
      req.expect.deepEqual(req.body.innerModel, expectedUpdateBody.innerModel);
      req.expect.deepEqual(req.body.intArray, expectedUpdateBody.intArray);
      return {
        status: 200,
        body: json({
          name: "Madge",
          map: {
            key: {
              name: "InnerMadge",
            },
          },
        }),
      };
    });
  } else {
    return mockapi.put(url, (req) => {
      req.expect.coercedBodyEquals(expectedCreateBody);
      return {
        status: 200,
        body: json(expectedCreateBody),
      };
    });
  }
}

Scenarios.Payload_JsonMergePatch_createResource = passOnSuccess(
  createMockApis("create/resource", false),
);
Scenarios.Payload_JsonMergePatch_updateResource = passOnSuccess(
  createMockApis("update/resource", true),
);
Scenarios.Payload_JsonMergePatch_updateOptionalResource = passOnSuccess(
  createMockApis("update/resource/optional", true),
);

Scenarios.Payload_JsonMergePatch_Create_Resource = passOnSuccess({
  uri: "/json-merge-patch/create/resource",
  mockMethods: [
    {
      method: "put",
      request: {
        body: expectedCreateBody,
      },
      response: {
        status: 200,
        data: expectedCreateBody,
      },
    },
  ],
});

Scenarios.Payload_JsonMergePatch_Update_Resource = passOnSuccess({
  uri: "/json-merge-patch/update/resource",
  mockMethods: [
    {
      method: "patch",
      request: {
        body: expectedUpdateBody,
      },
      response: {
        status: 200,
        data: {
          name: "Madge",
          map: {
            key: {
              name: "InnerMadge",
            },
          },
        },
      },
    },
  ],
});

Scenarios.Payload_JsonMergePatch_Update_Resource_Optional = passOnSuccess({
  uri: "/json-merge-patch/update/resource/optional",
  mockMethods: [
    {
      method: "patch",
      request: {
        body: expectedUpdateBody,
      },
      response: {
        status: 200,
        data: {
          name: "Madge",
          map: {
            key: {
              name: "InnerMadge",
            },
          },
        },
      },
    },
  ],
});
