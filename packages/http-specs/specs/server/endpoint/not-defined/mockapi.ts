import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Endpoint_Not_Defined_Valid = passOnSuccess({
  uri: "/server/endpoint/not-defined/valid",
  mockMethods: [
    {
      method: "head",
      request: {},
      response: {
        status: 200,
      },
      handler: (req: MockRequest) => {
        return { status: 200 };
      },
    },
  ],
});
