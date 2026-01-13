import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Overload_list = passOnSuccess({
  uri: "/client/overload/resources",
  method: "get",
  response: {
    status: 200,
    body: json([
      { id: "1", name: "foo", scope: "car" },
      { id: "2", name: "bar", scope: "bike" },
    ]),
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Overload_listByScope = passOnSuccess({
  uri: "/client/overload/resources/car",
  method: "get",
  response: {
    status: 200,
    body: json([{ id: "1", name: "foo", scope: "car" }]),
  },
  kind: "MockApiDefinition",
});
