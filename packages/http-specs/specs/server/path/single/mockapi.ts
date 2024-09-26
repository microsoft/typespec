import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Path_Single_MyOp = passOnSuccess({
  uri: "/server/path/single/myOp",
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
