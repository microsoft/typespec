import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_TypeChangedFrom_test = passOnSuccess(
  mockapi.post("/versioning/type-changed-from/api-version:v2/test", (req) => {
    req.expect.bodyEquals({ prop: "foo", changedProp: "bar" });
    req.expect.containsQueryParam("param", "baz");
    return {
      status: 200,
      body: json({ prop: "foo", changedProp: "bar" }),
    };
  }),
);

Scenarios.Versioning_TypeChangedFrom_API_Version_V2_Test = passOnSuccess({
  uri: `/versioning/type-changed-from/api-version:v2/test`,
  mockMethods: [
    {
      method: `post`,
      request: {
        config: {
          params: {
            param: "baz",
          },
        },
        body: {
          prop: "foo",
          changedProp: "bar",
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
          changedProp: "bar",
        },
      },
    },
  ],
});
