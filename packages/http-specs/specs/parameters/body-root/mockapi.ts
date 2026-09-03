import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_BodyRoot_nested = passOnSuccess({
  uri: "/parameters/body-root/nested",
  method: "post",
  request: {
    body: json({
      category: "widget",
      linkType: "hard",
      wasSuccessful: true,
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
