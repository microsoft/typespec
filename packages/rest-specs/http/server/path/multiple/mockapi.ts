import { passOnSuccess, ScenarioMockApi, mockapi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Path_Multiple_noOperationParams = passOnSuccess(
  mockapi.get("/server/path/multiple/v1.0", (req) => {
    return { status: 204 };
  }),
);

Scenarios.Server_Path_Multiple_withOperationPathParam = passOnSuccess(
  mockapi.get("/server/path/multiple/v1.0/test", (req) => {
    return { status: 204 };
  }),
);

Scenarios.Server_Path_Multiple_V10 = passOnSuccess({
  uri: "/server/path/multiple/v1.0",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 204,
      },
    },
  ],
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
    },
  ],
});
