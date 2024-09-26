import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(uri: string) {
  return passOnSuccess({
    uri: uri,
    mockMethods: [
      {
        method: "post",
        request: {},
        response: { status: 204 },
        handler: (req: MockRequest) => {
          return { status: 204 };
        },
      },
    ],
  });
}

Scenarios.Client_Structure_Client_Operation_Group_One = createServerTests(
  "/client/structure/client-operation-group/one",
);
Scenarios.Client_Structure_Client_Operation_Group_Two = createServerTests(
  "/client/structure/client-operation-group/two",
);
Scenarios.Client_Structure_Client_Operation_Group_Three = createServerTests(
  "/client/structure/client-operation-group/three",
);
Scenarios.Client_Structure_Client_Operation_Group_Four = createServerTests(
  "/client/structure/client-operation-group/four",
);
Scenarios.Client_Structure_Client_Operation_Group_Five = createServerTests(
  "/client/structure/client-operation-group/five",
);
Scenarios.Client_Structure_Client_Operation_Group_Six = createServerTests(
  "/client/structure/client-operation-group/six",
);
