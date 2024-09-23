import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
Scenarios.Client_Structure_ClientOperationGroup = passOnSuccess([
  mockapi.post("/client/structure/client-operation-group/one", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/client-operation-group/two", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/client-operation-group/three", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/client-operation-group/four", (req) => {
    return { status: 204 };
  }),
]);

Scenarios.Client_Structure_AnotherClientOperationGroup = passOnSuccess([
  mockapi.post("/client/structure/client-operation-group/five", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/client-operation-group/six", (req) => {
    return { status: 204 };
  }),
]);

function createServerTests(uri: string) {
  return passOnSuccess({
    uri: uri,
    mockMethods: [
      {
        method: "post",
        request: {},
        response: { status: 204 },
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
