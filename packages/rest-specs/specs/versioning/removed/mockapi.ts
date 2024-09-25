import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_Removed_v2 = passOnSuccess(
  mockapi.post("/versioning/removed/api-version:v2/v2", (req) => {
    req.expect.bodyEquals({ prop: "foo", enumProp: "enumMemberV2", unionProp: "bar" });
    return {
      status: 200,
      body: json({ prop: "foo", enumProp: "enumMemberV2", unionProp: "bar" }),
    };
  }),
);

Scenarios.Versioning_Removed_API_Version_V2_V2 = passOnSuccess({
  uri: `/versioning/removed/api-version:v2/v2`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: "bar",
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: "bar",
        },
      },
    },
  ],
});
