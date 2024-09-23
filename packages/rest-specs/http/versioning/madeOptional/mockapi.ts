import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_MadeOptional_test = passOnSuccess(
  mockapi.post("/versioning/made-optional/api-version:v2/test", (req) => {
    req.expect.bodyEquals({ prop: "foo" });
    return {
      status: 200,
      body: json({ prop: "foo" }),
    };
  }),
);

Scenarios.Versioning_MadeOptional_API_Version_V2_Test = passOnSuccess({
  uri: `/versioning/made-optional/api-version:v2/test`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          prop: "foo",
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
        },
      },
    },
  ],
});
