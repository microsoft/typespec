import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Endpoint_NotDefined_valid = passOnSuccess({
  uri: "/server/endpoint/not-defined/valid",
  mockMethod: {
    method: "head",
    request: {},
    response: {
      status: 200,
    },
    handler: (req: MockRequest) => {
      return { status: 200 };
    },
  },
  kind: "MockApiDefinition",
});
