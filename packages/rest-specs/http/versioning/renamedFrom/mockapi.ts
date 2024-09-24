import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_RenamedFrom_newOp = passOnSuccess(
  mockapi.post("/versioning/renamed-from/api-version:v2/test", (req) => {
    req.expect.bodyEquals({ newProp: "foo", enumProp: "newEnumMember", unionProp: 10 });
    req.expect.containsQueryParam("newQuery", "bar");
    return {
      status: 200,
      body: json({ newProp: "foo", enumProp: "newEnumMember", unionProp: 10 }),
    };
  }),
);

Scenarios.Versioning_RenamedFrom_NewInterface = passOnSuccess(
  mockapi.post("/versioning/renamed-from/api-version:v2/interface/test", (req) => {
    req.expect.bodyEquals({ newProp: "foo", enumProp: "newEnumMember", unionProp: 10 });
    return {
      status: 200,
      body: json({ newProp: "foo", enumProp: "newEnumMember", unionProp: 10 }),
    };
  }),
);

Scenarios.Versioning_RenamedFrom_API_Version_V2_Test = passOnSuccess({
  uri: `/versioning/renamed-from/api-version:v2/test`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          newProp: "foo",
          enumProp: "newEnumMember",
          unionProp: 10,
        },
        config: {
          params: {
            newQuery: "bar",
          },
        },
      },
      response: {
        status: 200,
        data: {
          newProp: "foo",
          enumProp: "newEnumMember",
          unionProp: 10,
        },
      },
    },
  ],
});

Scenarios.Versioning_RenamedFrom_API_Version_V2_Interface_Test = passOnSuccess({
  uri: `/versioning/renamed-from/api-version:v2/interface/test`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          newProp: "foo",
          enumProp: "newEnumMember",
          unionProp: 10,
        },
      },
      response: {
        status: 200,
        data: {
          newProp: "foo",
          enumProp: "newEnumMember",
          unionProp: 10,
        },
      },
    },
  ],
});
