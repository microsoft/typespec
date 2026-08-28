import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_MadeOptional_test = passOnSuccess({
  uri: `/versioning/made-optional/api-version:v2/test`,
  method: `post`,
  request: {
    body: json({
      prop: "foo",
    }),
  },
  response: {
    status: 200,
    body: json({ prop: "foo" }),
  },
  kind: "MockApiDefinition",
});
