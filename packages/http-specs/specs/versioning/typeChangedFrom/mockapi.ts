import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_TypeChangedFrom_API_Version_V2_Test = passOnSuccess({
  uri: `/versioning/type-changed-from/api-version:v2/test`,
  mockMethods: [
    {
      method: `post`,
      request: {
        params: {
          param: "baz",
        },
        body: {
          prop: "foo",
          changedProp: "bar",
        },
      },
      response: {
        status: 200,
        body: json({ prop: "foo", changedProp: "bar" }),
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ prop: "foo", changedProp: "bar" });
        req.expect.containsQueryParam("param", "baz");
        return {
          status: 200,
          body: json({ prop: "foo", changedProp: "bar" }),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
