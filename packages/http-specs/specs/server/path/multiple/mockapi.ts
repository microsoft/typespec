import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Path_Multiple_V10 = passOnSuccess({
  uri: "/server/path/multiple/v1.0",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Server_Path_Multiple_V10_Test = passOnSuccess({
  uri: "/server/path/multiple/v1.0/test",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
