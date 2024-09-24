import { mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
Scenarios.Client_Structure_Service = passOnSuccess([
  mockapi.post("/client/structure/default/one", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/two", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/three", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/four", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/five", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/six", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/seven", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/eight", (req) => {
    return { status: 204 };
  }),
  mockapi.post("/client/structure/default/nine", (req) => {
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

Scenarios.Client_Structure_Default_One = createServerTests("/client/structure/default/one");
Scenarios.Client_Structure_Default_Two = createServerTests("/client/structure/default/two");
Scenarios.Client_Structure_Default_Three = createServerTests("/client/structure/default/three");
Scenarios.Client_Structure_Default_Four = createServerTests("/client/structure/default/four");
Scenarios.Client_Structure_Default_Five = createServerTests("/client/structure/default/five");
Scenarios.Client_Structure_Default_Six = createServerTests("/client/structure/default/six");
Scenarios.Client_Structure_Default_Seven = createServerTests("/client/structure/default/seven");
Scenarios.Client_Structure_Default_Eight = createServerTests("/client/structure/default/eight");
Scenarios.Client_Structure_Default_Nine = createServerTests("/client/structure/default/nine");
