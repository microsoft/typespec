import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_TypeChangedFrom_test = passOnSuccess({
  uri: `/versioning/type-changed-from/api-version:v2/test`,
  method: `post`,
  request: {
    query: {
      param: "baz",
    },
    body: json({
      prop: "foo",
      changedProp: "bar",
    }),
  },
  response: {
    status: 200,
    body: json({ prop: "foo", changedProp: "bar" }),
  },
  kind: "MockApiDefinition",
});
