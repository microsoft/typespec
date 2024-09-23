import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
Scenarios.Client_Structure_MultiClient = passOnSuccess([
  mockapi.post("/client/structure/multi-client/one", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/multi-client/two", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/multi-client/three", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/multi-client/four", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/multi-client/five", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/multi-client/six", (req) => {
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

Scenarios.Client_Structure_Multi_Client_One = createServerTests("/client/structure/multi-client/one");
Scenarios.Client_Structure_Multi_Client_Two = createServerTests("/client/structure/multi-client/two");
Scenarios.Client_Structure_Multi_Client_Three = createServerTests("/client/structure/multi-client/three");
Scenarios.Client_Structure_Multi_Client_Four = createServerTests("/client/structure/multi-client/four");
Scenarios.Client_Structure_Multi_Client_Five = createServerTests("/client/structure/multi-client/five");
Scenarios.Client_Structure_Multi_Client_Six = createServerTests("/client/structure/multi-client/six");
