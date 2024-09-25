import { mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
Scenarios.Client_Structure_TwoOperationGroup = passOnSuccess([
  mockapi.post("/client/structure/two-operation-group/one", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/two-operation-group/two", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/two-operation-group/three", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/two-operation-group/four", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/two-operation-group/five", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/two-operation-group/six", (req) => {
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

Scenarios.Client_Structure_Two_Operation_Group_One = createServerTests(
  "/client/structure/two-operation-group/one",
);
Scenarios.Client_Structure_Two_Operation_Group_Two = createServerTests(
  "/client/structure/two-operation-group/two",
);
Scenarios.Client_Structure_Two_Operation_Group_Three = createServerTests(
  "/client/structure/two-operation-group/three",
);
Scenarios.Client_Structure_Two_Operation_Group_Four = createServerTests(
  "/client/structure/two-operation-group/four",
);
Scenarios.Client_Structure_Two_Operation_Group_Five = createServerTests(
  "/client/structure/two-operation-group/five",
);
Scenarios.Client_Structure_Two_Operation_Group_Six = createServerTests(
  "/client/structure/two-operation-group/six",
);
