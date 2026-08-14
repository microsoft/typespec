import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Response_BodyOrNoContent_getBody = passOnSuccess({
  uri: "/response/body-or-no-content/body",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({
      content: "hello",
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Response_BodyOrNoContent_getNoContent = passOnSuccess({
  uri: "/response/body-or-no-content/no-content",
  method: "get",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
