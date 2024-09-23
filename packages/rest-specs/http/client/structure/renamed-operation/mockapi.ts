import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
Scenarios.Client_Structure_RenamedOperation = passOnSuccess([
  mockapi.post("/client/structure/renamed-operation/one", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/renamed-operation/two", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/renamed-operation/three", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/renamed-operation/four", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/renamed-operation/five", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/renamed-operation/six", (req) => {
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

Scenarios.Client_Structure_Renamed_Operation_One = createServerTests("/client/structure/renamed-operation/one");
Scenarios.Client_Structure_Renamed_Operation_Two = createServerTests("/client/structure/renamed-operation/two");
Scenarios.Client_Structure_Renamed_Operation_Three = createServerTests("/client/structure/renamed-operation/three");
Scenarios.Client_Structure_Renamed_Operation_Four = createServerTests("/client/structure/renamed-operation/four");
Scenarios.Client_Structure_Renamed_Operation_Five = createServerTests("/client/structure/renamed-operation/five");
Scenarios.Client_Structure_Renamed_Operation_Six = createServerTests("/client/structure/renamed-operation/six");
