import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Operations_List_ServerDrivenPagination_link = passOnSuccess([
  {
    uri: "/operations/list/server-driven-pagination/link",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: [
          { id: "1", name: "dog" },
          { id: "2", name: "cat" },
        ],
        links: {
          next: "/operations/list/server-driven-pagination/link/nextPage",
        },
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/operations/list/server-driven-pagination/link/nextPage",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: [
          { id: "3", name: "bird" },
          { id: "4", name: "fish" },
        ],
      }),
    },
    kind: "MockApiDefinition",
  },
]);
